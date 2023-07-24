import * as vscode from "vscode";

// Define a custom interface for the terminal object (optional, based on your specific use case)
interface CustomTerminal extends vscode.Terminal {
  name: string;
}

function getActiveTerminals(): CustomTerminal[] {
  // Convert the readonly array to a mutable array by creating a copy
  return vscode.window.terminals.slice();
}

function findTerminalsByName(name: string): CustomTerminal | undefined {
  let terminals = getActiveTerminals();
  let found = terminals.find((element) => element.name === name);
  return found;
}

function findOrCreateTerminal(name: string): CustomTerminal {
  let terminal = findTerminalsByName(name);
  if (!terminal) {
    terminal = vscode.window.createTerminal(name);
  }
  return terminal;
}

export function getShowLama2Term(name: string): CustomTerminal {
  let terminal = findOrCreateTerminal(name);
  // Clear terminal and send Ctrl+C before showing
  terminal.sendText("\x03");
  terminal.show();
  return terminal;
}