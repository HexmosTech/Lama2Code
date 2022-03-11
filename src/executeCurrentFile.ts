import * as vscode from 'vscode';
import ChokiExtension from './watchFile'
var Convert = require('ansi-to-html');
var convert = new Convert({
    "newline": true
});

let fs = require('fs')

let ELF_TERM_NAME = "AutoElfling"
let outPath:string = "";
let flagPath:string = "";

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

function generateRandomName(length:any) {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
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
        "cmd": `elf ${currentFilePath} 2>&1 | tee ${randomNameFile}; touch ${randomNameFlag}`,
        "rflag": randomNameFlag,
        "rfile": randomNameFile
    }
}

function getWrappedHtml(htmlContent:string) {
    return `<div>${htmlContent}</div>}`
}

function getOrCreateWebPanel() {
    // TODO
}

function postElfCommand() {
    const panel = vscode.window.createWebviewPanel(
        'elfOutput',
        'Elf Output',
        vscode.ViewColumn.Beside,
        {}
    );
    let content = fs.readFileSync(outPath).toString()
    let htmlContent = convert.toHtml(content)
    panel.webview.html = getWrappedHtml(htmlContent)

    fs.unlinkSync(outPath);
    fs.unlinkSync(flagPath);
}


function onElfFinish(fp:any) {
    vscode.window.showInformationMessage(`Elf command completed according to ${fp}`)
    postElfCommand()
}

function execElfCommand(elfTerm:vscode.Terminal, elfCommand:string) {
    elfTerm.sendText(elfCommand)
}

function setElfWatch() {
    let c = new ChokiExtension()
    c.pathAddTrigger(flagPath, onElfFinish)
}

export default function ExecuteCurrentFile() {
    let terminal = getShowElfTerm(ELF_TERM_NAME)
    let {cmd, rflag, rfile} = getElfCommand()
    outPath = rfile
    flagPath = rflag
    setElfWatch()
    execElfCommand(terminal, cmd)
}