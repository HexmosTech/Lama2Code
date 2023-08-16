import * as vscode from "vscode";
import {
  replaceTextAfterEnvSelected,
  suggestENVs,
} from "./suggestEnvironmentVars";

export function activate(context: vscode.ExtensionContext) {

  let suggestEnvVariables: any;
  suggestEnvVariables = suggestENVs();

  context.subscriptions.push(
    suggestEnvVariables,
    vscode.commands.registerCommand("envoptions", (selectedEnv: string) => {
      // This method is activated when the user selects a suggested env variable.
      replaceTextAfterEnvSelected(selectedEnv);
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }
