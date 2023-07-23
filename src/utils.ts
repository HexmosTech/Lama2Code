import * as vscode from "vscode";

function getActiveTerminals() {
  return vscode.window.terminals;
}

function findTerminalsByName(name: string) {
  let terminals = getActiveTerminals();
  let found = terminals.find((element) => element.name == name);
  return found;
}

function findOrCreateTerminal(name: string) {
  let terminal = findTerminalsByName(name);
  if (terminal == null) {
    return vscode.window.createTerminal(name);
  } else {
    return terminal;
  }
}


export function getShowLama2Term(name: string) {
  let terminal = findOrCreateTerminal(name);
  // Clear terminal and send Ctrl+C before showing
  terminal.sendText("\x1Bc");
  terminal.sendText("\x03");
  terminal.show();
  return terminal;
}