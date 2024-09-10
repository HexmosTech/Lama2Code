import * as vscode from "vscode"
import ChokiExtension from "../utilities/watchFile"
import { getLama2Command, getShowLama2Term } from "../utilities/utils"
import { splitLama2Output } from "../commands/ExecuteCurrentFile/parseOut"
import { getUri } from "../utilities/getUri"
import { getNonce } from "../utilities/getNonce"
import { executeL2Command } from "../lsp/request/generalRequest"
import { IJSONRPCResponse } from "../lsp/response/generalResponse"

export class Lama2Panel {
  public static currentPanel: Lama2Panel | undefined
  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private _disposables: vscode.Disposable[] = []
  private terminal: vscode.Terminal | undefined
  private command: string | undefined

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Set the webview's html content
    this._update()

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview)
  }

  public static render(extensionUri: vscode.Uri) {
    if (Lama2Panel.currentPanel) {
      // If the webview panel already exists reveal it
      console.log("revealing existing panel")
      Lama2Panel.currentPanel._panel.reveal(vscode.ViewColumn.Two, true)
    } else {
      console.log("opening new panel")
      vscode.commands.executeCommand('workbench.action.closePanel');

      // If a webview panel does not already exist create and show a new one
      const panel = vscode.window.createWebviewPanel(
        // Panel view type
        "showLama2Output",
        // Panel title
        "Lama2 Output",
        // The editor column the panel should be displayed in
        
        // { preserveFocus: true, viewColumn: vscode.ViewColumn.Two },
        { preserveFocus: true, viewColumn: vscode.ViewColumn.Two },
        
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, "out"),
            vscode.Uri.joinPath(extensionUri, "webview/build"),
            vscode.Uri.joinPath(extensionUri, "webview/codicons/dist"),
            vscode.Uri.joinPath(extensionUri, "media"),
            vscode.Uri.joinPath(extensionUri, "images"),
            vscode.Uri.joinPath(extensionUri, "assets"),
          ],
        }
      )

      Lama2Panel.currentPanel = new Lama2Panel(panel, extensionUri)
    }
  }

  public async executeLama2Command(langServer: any) {
    try {
      this._panel.webview.postMessage({
        command: "update",
        status: "starting",
      });

      const lama2Command = getLama2Command();
      if (!lama2Command) {
        console.error("Failed to generate Lama2 command");
        return;
      }

      const { cmd, currentFilePath } = lama2Command;
      this.command = cmd
      if (!currentFilePath) {
        console.error("Failed to get current file path");
        return;
      }

      // Execute command using LSP
      const response: IJSONRPCResponse = await executeL2Command(langServer, 2, currentFilePath);

      if (response.error) {
        this.handleCommandError(response.error.message);
      } else {
        // Process the response
        const body = response.result;
        const [httpHead ] = splitLama2Output(response.result);

        this._panel.webview.postMessage({
          command: "update",
          status: "finished",
          lama2Log:"",
          httpHead,
          body,
        });
      }
    } catch (error) {
      console.error("Error executing Lama2 command:", error);
      this.handleCommandError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  }

  // private setLama2Watch(rflag: string) {
  //   let c = new ChokiExtension()
  //   console.log("setLama2Watch", rflag)
  //   console.log(this.terminal?.name)
  //   c.pathAddTrigger(rflag, this.onLama2Finish, this)
  // }

  private handleCommandError(errorMessage: string) {
    // Remove ANSI color codes and other formatting
    const cleanedMessage = errorMessage.replace(/\u001b\[\d+m/g, "")

    const parseErrorMatch = cleanedMessage.match(/Parse Error Error="([^"]+)"/)

    const errorToSend = parseErrorMatch ? parseErrorMatch[1] : cleanedMessage

    this._panel.webview.postMessage({
      command: "update",
      status: "error",
      error: errorToSend,
    })
  }

  public dispose() {
    Lama2Panel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  private _update() {
    const webview = this._panel.webview
    this._panel.webview.html = this._getHtmlForWebview(webview)
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, this._extensionUri, ["webview", "build", "assets", "index.css"])
    // The JS file from the React build output
    const scriptUri = getUri(webview, this._extensionUri, ["webview", "build", "assets", "index.js"])

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "webview", "codicons", "dist", "codicon.css")
    )

    const nonce = getNonce()

    return /*html*/ `
      <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
           <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: http: data: ${webview.cspSource} 'unsafe-inline'; style-src vscode-resource: https: http: data: ${webview.cspSource} 'unsafe-inline' https://*.vscode-cdn.net; script-src vscode-resource: 'nonce-${nonce}' 'unsafe-inline'; font-src ${webview.cspSource}; frame-src *;">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
           <link href="${codiconsUri}" rel="stylesheet" />
            <title>Lama2</title>
        </head>
        <body>
            <div id="root"></div>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>
    `
  }

  private copyL2Command() {
    if (this.command) {
      vscode.env.clipboard.writeText(this.command)
    }
    vscode.window.showInformationMessage("Lama2 command copied to clipboard. Paste and execute from any terminal")
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        console.log("message", message)
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text)
            return
          case "showNotification":
            vscode.window.showInformationMessage(message.text)
            break
          case "copyL2Command":
            this.copyL2Command()
            return
        }
      },
      undefined,
      this._disposables
    )
  }


  // private async toggleTerminal() {
  //   const activeTerminal = vscode.window.activeTerminal;
  //   console.log("activeTerminal", activeTerminal?.name)
  //   const terminals = vscode.window.terminals;

  //   await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');

  //   // if (activeTerminal && activeTerminal.name === "AutoLama2") {
  //   //   // If AutoLama2 terminal is active, hide it
  //   //   console.log("hide terminal", activeTerminal)
  //   //   await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
  //   //   await vscode.commands.executeCommand('workbench.action.terminal.focus')

  //   // } else {
  //   //   // If AutoLama2 terminal is not active or no terminal is active, show it

  //   //   if (this.terminal) {
  //   //     console.log("show terminal", this.terminal)
  //   //     this.terminal.show(true); // false means don't focus the terminal
  //   //   } else {
  //   //     console.log("show terminal", this.terminal)
  //   //     // If no AutoLama2 terminal exists, just toggle the terminal panel
  //   //     await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
  //   //   }
  //   // }
  // }


  private async toggleTerminal() {
    const isTerminalVisible = vscode.window.terminals.length > 0;
    console.log("isTerminalVisible", isTerminalVisible)
    const terminalFocused = vscode.window.activeTerminal
    console.log("terminalFocused", terminalFocused)
    console.log(terminalFocused?.name)

    // const isVisible = await this.isPanelVisible();
    // console.log("isVisible", isVisible)

    // const focusedPanel = await this.getFocusedPanelName();
    // if (focusedPanel) {
    //   console.log(`The focused panel is: ${focusedPanel}`);
    // } else {
    //   console.log('No panel is currently focused');
    // }

    if (this.terminal) {
      console.log("hide terminal", this.terminal)
      // this.terminal.hide()
      // this.terminal.show(true); // false means don't focus the terminal
      // await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
      // await vscode.commands.executeCommand('workbench.action.terminal.focus')
      // const terminal = vscode.window.terminals.find(t => t.name === "AutoLama2");
      // if (!terminal) {
      //   await vscode.commands.executeCommand('workbench.action.togglePanel');
      // }
      if (terminalFocused?.name !== "AutoLama2") {
        console.log("terminal is not lama2 terminal")
        // check lama2 terminal is exist
        const terminal = vscode.window.terminals.find(t => t.name === "AutoLama2");
        if (!terminal) {
          await vscode.commands.executeCommand('workbench.action.togglePanel');
        }
        else {
          await this.switchToAutoLama2();
          await vscode.commands.executeCommand('workbench.action.closePanel');
        }

      } else {
        console.log("terminal is lama2 terminal")
        await vscode.commands.executeCommand('workbench.action.togglePanel');
      }



      // await vscode.commands.executeCommand('workbench.action.terminal.focus')

      // await vscode.commands.executeCommand('workbench.action.terminal.focusAccessibleBuffer');
      // this.terminal.hide()

      // await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup')
      // await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
      // await vscode.commands.executeCommand('workbench.action.closePanel');
      // setTimeout(async () => {
      //   await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
      // }, 20000)
    }
    else {
      console.log("show terminal if terminal is not exist")
      await vscode.commands.executeCommand('workbench.action.togglePanel');
    }

    // If terminal is focused, hide it
    // await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
  }
  private switchToAutoLama2 = async () => {
    while (vscode.window.activeTerminal?.name !== "AutoLama2") {
      await vscode.commands.executeCommand('workbench.action.terminal.focusNext');
    }
  };


}
