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

function getElfCommand() {
    let currentFilePath = vscode.window.activeTextEditor?.document.fileName
    return `elf ${currentFilePath}`
}

function execElfCommand(elfTerm:vscode.Terminal, elfCommand:string) {
    elfTerm.sendText(elfCommand)
}

export default function ExecuteCurrentFile() {
    let terminal = getShowElfTerm(ELF_TERM_NAME)
    let command = getElfCommand()
    execElfCommand(terminal, command)
}