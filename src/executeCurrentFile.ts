import * as vscode from 'vscode';

let ELF_TERM_NAME = "AutoElfling"

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

function execElfCommand(elfTerm:vscode.Terminal, elfCommand:string) {
    elfTerm.sendText(elfCommand)
}

export default function ExecuteCurrentFile() {
    let terminal = getShowElfTerm(ELF_TERM_NAME)
    let {cmd, rflag, rfile} = getElfCommand()
    execElfCommand(terminal, cmd)
}