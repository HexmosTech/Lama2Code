import * as vscode from 'vscode';
import ChokiExtension from './watchFile';
var Convert = require('ansi-to-html');
let fs = require('fs')
import splitElfOutput from './parseOut'

var convert = new Convert({
    "newline": true
});

let ELF_TERM_NAME = "AutoElfling"
let outPath: string = "";
let flagPath: string = "";
var panel:any;

function getActiveTerminals() {
    return vscode.window.terminals;
}

function findTerminalsByName(name: string) {
    let terminals = getActiveTerminals()
    let found = terminals.find(element => element.name == name)
    return found
}

function findOrCreateTerminal(name: string) {
    let terminal = findTerminalsByName(name)
    if (terminal == null) {
        return vscode.window.createTerminal(name)
    } else {
        return terminal
    }
}

function getShowElfTerm(name: string) {
    let terminal = findOrCreateTerminal(name)
    terminal.show()
    return terminal
}

function generateRandomName(length: any) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function getElfCommand() {
    let randomNameBase = generateRandomName(8)
    let randomNameFlag = `/tmp/${randomNameBase}.flag`
    let randomNameFile = `/tmp/${randomNameBase}.out`
    let currentFilePath = vscode.window.activeTextEditor?.document.fileName
    return {
        "cmd": `elf -n ${currentFilePath} 2>&1 | tee ${randomNameFile}; touch ${randomNameFlag}`,
        "rflag": randomNameFlag,
        "rfile": randomNameFile
    }
}

function getWrappedHtml(elflogHTML: string, httpHead: string, body: string) {
    return `<div id="container">
        <h2>Elf Log</h2>
        ><div>${elflogHTML}</div>
        <h2>Headers</h2>
        <div>${httpHead}</div>
        <h2>Response Body</h2>
        <div>${body}</div>
    <div>`;
}

function getOrCreateWebPanel() {
    // TODO
}

function getSpinnerFragment() {
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

function postElfCommand() {
    let content = fs.readFileSync(outPath).toString();
    let elflog, httpHead, body;
    [elflog, httpHead, body] = splitElfOutput(content);
    let elflogHTML = convert.toHtml(elflog);
    let httpHeadHTML = convert.toHtml(httpHead);
    panel.webview.html = getWrappedHtml(elflogHTML, httpHeadHTML, body);

    fs.unlinkSync(outPath);
    fs.unlinkSync(flagPath);
}


function onElfFinish(fp: any) {
    vscode.window.showInformationMessage(`Elf command completed according to ${fp}`)
    postElfCommand()
}

function execElfCommand(elfTerm: vscode.Terminal, elfCommand: string) {
    console.log("elfTerm: ", elfTerm, "elfCommand: ", elfCommand)
    if(panel) {
        panel.reveal()
    } else {
        panel = vscode.window.createWebviewPanel(
            'elfOutput',
            'Elf Output',
            vscode.ViewColumn.Beside,
            {}
        );
    }
    panel.webview.html = `<h2>Loading...</h2>${getSpinnerFragment()}`
    elfTerm.sendText(elfCommand)
}

function setElfWatch() {
    let c = new ChokiExtension()
    c.pathAddTrigger(flagPath, onElfFinish)
}

export default function ExecuteCurrentFile() {
    let terminal = getShowElfTerm(ELF_TERM_NAME)
    let { cmd, rflag, rfile } = getElfCommand()
    outPath = rfile
    flagPath = rflag
    setElfWatch()
    execElfCommand(terminal, cmd)
}