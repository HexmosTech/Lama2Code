import * as vscode from 'vscode';
import ChokiExtension from './watchFile';
var Convert = require('ansi-to-html');
let fs = require('fs')
var path = require('path');
var json2html = require('json2html')
import splitElfOutput from './parseOut'

class ExecuteCurrentFile {
    ELF_TERM_NAME = "AutoElfling"
    outPath: string = "";
    flagPath: string = "";
    panel: any;
    context: vscode.ExtensionContext;
    convert = new Convert({
        "newline": true
    });

    constructor(ctx: vscode.ExtensionContext) {
        this.context = ctx
    }


    getActiveTerminals() {
        return vscode.window.terminals;
    }

    findTerminalsByName(name: string) {
        let terminals = this.getActiveTerminals()
        let found = terminals.find(element => element.name == name)
        return found
    }

    findOrCreateTerminal(name: string) {
        let terminal = this.findTerminalsByName(name)
        if (terminal == null) {
            return vscode.window.createTerminal(name)
        } else {
            return terminal
        }
    }

    getShowElfTerm(name: string) {
        let terminal = this.findOrCreateTerminal(name)
        terminal.show()
        return terminal
    }

    generateRandomName(length: any) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;
    }

    getElfCommand() {
        let randomNameBase = this.generateRandomName(8)
        let randomNameFlag = `/tmp/${randomNameBase}.flag`
        let randomNameFile = `/tmp/${randomNameBase}.out`
        let currentFilePath = vscode.window.activeTextEditor?.document.fileName
        return {
            "cmd": `elf -n ${currentFilePath} 2>&1 | tee ${randomNameFile}; touch ${randomNameFlag}`,
            "rflag": randomNameFlag,
            "rfile": randomNameFile
        }
    }

    getScriptTags(scripts: Array<string>) {
        let op: string = ""
        for (let s of scripts) {
            op += `<script src="${s}"></script>`
        }
        return op;
    }

    getStyleTags(styles: Array<string>) {
        let op: string = ""
        for (let s of styles) {
            op += `<link rel="stylesheet" href="${s}"/>`
        }
        return op;
    }

    getWrappedHtml(elflogHTML: string, httpHead: string, body: string, styles: Array<string>, scripts: Array<string>) {
        /*
        try {
            var j = JSON.parse(body)
            body = json2html.render(j, {plainHTML: true})
        } catch (e) {}
        */
        return `${this.getStyleTags(styles)}
        <ul data-tabs>
            <li><a data-tabby-default href="#main">Response</a></li>
            <li><a href="#httphead">Headers</a></li>
            <li><a href="#elflog">Elf Logs</a></li>
        </ul>
        <div id="main">
            <div id="responsebody">${body}</div>
            <div id="wrapper"></div>
        </div>
        <div id="httphead">${httpHead}</div>
        <div id="elflog">${elflogHTML}</div>
        ${this.getScriptTags(scripts)}
        `
    }

    getOrCreateWebPanel() {
        // TODO
    }

    getSpinnerFragment() {
        let spinner = `<style>
    .lds-dual-ring {
  display: inline-block;
  width: 80px;
  height: 80px;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}</style><div class="lds-dual-ring"></div>
`
        return spinner
    }

    getWebViewUri(filename: string) {
        const styleOnDiskPath = vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', filename)
        );
        return this.panel.webview.asWebviewUri(styleOnDiskPath);

    }

    postElfCommand() {
        let content = fs.readFileSync(this.outPath).toString();
        console.log("Content = ", content)
        let elflog, httpHead, body;
        [elflog, httpHead, body] = splitElfOutput(content);
        console.log("body = ", body)
        let elflogHTML = this.convert.toHtml(elflog);
        let httpHeadHTML = this.convert.toHtml(httpHead);
        const stylesrc = this.getWebViewUri('style.css')
        const j2hstyle = this.getWebViewUri('index.css')
        const scriptsrc = this.getWebViewUri('script.js')
        const j2h = this.getWebViewUri('j2h-converter.js')

        const tabbyjs = this.getWebViewUri('tabby.polyfills.min.js')
        const tabbycss = this.getWebViewUri('tabby-ui.min.css')

        // const treestyle = this.getWebViewUri('jsonTree.css')
        // const jsonview = this.getWebViewUri('jsonview.js')

        const jquery = this.getWebViewUri('jquery.min.js')

        const styles = [stylesrc, j2hstyle, tabbycss]
        const scripts = [jquery, j2h, tabbyjs, scriptsrc]
        this.panel.webview.html = this.getWrappedHtml(elflogHTML, httpHeadHTML, body, styles, scripts);

        fs.unlinkSync(this.outPath);
        fs.unlinkSync(this.flagPath);
    }


    onElfFinish(fp: any) {
        vscode.window.showInformationMessage(`Elf command completed according to ${fp}`)
        this.postElfCommand()
    }

    execElfCommand(elfTerm: vscode.Terminal, elfCommand: string) {
        console.log("elfTerm: ", elfTerm, "elfCommand: ", elfCommand)
        if (this.panel) {
            console.log("Reusing existing panel")
            this.panel.reveal()
        } else {
            console.log("Creating new panel")
            this.panel = vscode.window.createWebviewPanel(
                'elfOutput',
                'Elf Output',
                vscode.ViewColumn.Beside,
                {
                    // Only allow the webview to access resources in our extension's media directory
                    localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media'))],
                    enableFindWidget: true,
                    enableScripts: true
                }
            );
            this.panel.onDidDispose(
                () => {
                    this.panel = undefined;
                },
                undefined,
                this.context.subscriptions
            );
            this.panel.webview.onDidReceiveMessage(
                (message: any) => {
                    switch (message.command) {
                        case 'alert':
                            vscode.window.showInformationMessage(message.text);
                            return;
                    }
                },
                undefined,
                this.context.subscriptions
            );
        }
        this.panel.webview.html = `<h2>Loading...</h2>${this.getSpinnerFragment()}`
        elfTerm.sendText(elfCommand)
    }

    setElfWatch() {
        let c = new ChokiExtension()
        c.pathAddTrigger(this.flagPath, this.onElfFinish, this)
    }

    execFile() {
        let terminal = this.getShowElfTerm(this.ELF_TERM_NAME)
        let { cmd, rflag, rfile } = this.getElfCommand()
        this.outPath = rfile
        this.flagPath = rflag
        this.setElfWatch()
        this.execElfCommand(terminal, cmd)
    }

}

export default ExecuteCurrentFile
