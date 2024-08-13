import * as vscode from 'vscode';
import * as path from 'path';
import ChokiExtension from '../commands/executecurrentfile/watchFile';
import { getLama2Command, getShowLama2Term } from '../commands/executecurrentfile/utils';
import { splitLama2Output } from '../commands/executecurrentfile/parseOut';
import { getUri } from '../utilities/getUri';
import { getNonce } from '../utilities/getNonce';
import { exec } from 'child_process';
import * as fs from 'fs';


export class Lama2Panel {
    public static currentPanel: Lama2Panel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Set the webview's html content
        this._update();

        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
    }

    public static render(extensionUri: vscode.Uri) {

        if (Lama2Panel.currentPanel) {
            // If the webview panel already exists reveal it
            Lama2Panel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
        } else {
            // If a webview panel does not already exist create and show a new one
            const panel = vscode.window.createWebviewPanel(
                // Panel view type
                "showLama2Output",
                // Panel title
                "Lama2 Output",
                // The editor column the panel should be displayed in
                vscode.ViewColumn.Two,
                // Extra panel configurations
                {
                    // Enable JavaScript in the webview
                    enableScripts: true,
                    // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
                    localResourceRoots: [
                        vscode.Uri.joinPath(extensionUri, "out"),
                        vscode.Uri.joinPath(extensionUri, "webview/build")
                    ],
                }
            );

            Lama2Panel.currentPanel = new Lama2Panel(panel, extensionUri);
        }
    }

    public async executeLama2Command() {
        this._panel.webview.postMessage({ 
            command: 'update',
            body: JSON.stringify({ status: 'starting' })
        });

        const { cmd, rflag, rfile } = getLama2Command();
        console.log("rflag", rflag);
        console.log("rfile", rfile);

        // Execute command and capture output
        exec(cmd, (error, stdout, stderr) => {
            if (stdout) {
                fs.access(rfile, fs.constants.F_OK, (err) => {
                console.log('Checking if output file exists',err);
                if (err) {
                    // console.log('Checking if output file exists');
                    this.handleCommandError("Output file not created");
                } else {
                    this.onLama2Finish(rfile);
                }
                });
                return
            }
            
            if (error) {
                console.error(`exec error: ${error}`);
                this.handleCommandError(stderr);
                return;
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
                this.handleCommandError(stderr);
                return;
            }

            console.log(`stdout: ${stdout}`);
            
            // Check if the output file exists
            
            
        });
    }

    private handleCommandError(errorMessage: string) {
        console.error('Error executing Lama2 command:', typeof(errorMessage));
        const parseErrorMatch = errorMessage.match(/Parse Error Error="(.+?)"/);
        console.log('parseErrorMatch', parseErrorMatch);
        const errorToSend = parseErrorMatch ? parseErrorMatch[1] : errorMessage;

        this._panel.webview.postMessage({
            command: 'update',
            body: JSON.stringify({ 
                status: 'error',
                error: errorToSend
            })
        });
    }

    private async onLama2Finish(outputFile: string) {
    try {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(outputFile));
        const [lama2Log, httpHead, body] = splitLama2Output(content.toString());

        // Check if the body is valid JSON
        JSON.parse(body); // This will throw an error if body is not valid JSON

        // Send data to webview
        this._panel.webview.postMessage({ 
            command: 'update',
            status: 'finished',
            lama2Log,
            httpHead,
            body
        });

        // Clean up temporary files
        await vscode.workspace.fs.delete(vscode.Uri.file(outputFile));
    } catch (error) {
        console.error('Error processing Lama2 output:', error);
        this.handleCommandError(error instanceof Error ? error.message : 'An error occurred while processing the Lama2 output');
    }
}

    public dispose() {
        Lama2Panel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // The CSS file from the React build output
        const stylesUri = getUri(webview, this._extensionUri, ["webview", "build", "assets", "index.css"]);
        // The JS file from the React build output
        const scriptUri = getUri(webview, this._extensionUri, ["webview", "build", "assets", "index.js"]);
      
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview','build', 'codicons', 'dist', 'codicon.css'));

        const nonce = getNonce();

        return /*html*/ `
      <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; font-src ${webview.cspSource};">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
           <link href="${codiconsUri}" rel="stylesheet" />
            <title>Lama2</title>
        </head>
        <body>
            <div id="root"></div>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            <div class="icon"><i class="codicon codicon-account"></i> account</div>
					<div class="icon"><i class="codicon codicon-activate-breakpoints"></i> activate-breakpoints</div>
					<div class="icon"><i class="codicon codicon-add"></i> add</div>
					<div class="icon"><i class="codicon codicon-archive"></i> archive</div>
					<div class="icon"><i class="codicon codicon-arrow-both"></i> arrow-both</div>
					<div class="icon"><i class="codicon codicon-arrow-down"></i> arrow-down</div>
					<div class="icon"><i class="codicon codicon-arrow-left"></i> arrow-left</div>
        </body>
        </html>
    `;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }
}