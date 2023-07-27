import * as vscode from "vscode";
import { exec } from "child_process";

export function prettifyL2File() {
  return vscode.commands.registerCommand("lama2.PrettifyCurrentFile", () => {
    console.log("Executing prettify command");
    exec(`l2 -b ${vscode.window.activeTextEditor?.document.fileName}`);
  });
}
