import * as vscode from "vscode";

import { genCodeSnip } from "./generateCodeSnippet";
import { getRemoteUrl } from "./getRemoteUrl";
import { replaceTextAfterEnvSelected, suggestENVs } from "./suggestEnvironmentVars";
import { genLama2Examples } from "./genLama2Examples";
import { execCurL2File } from "./executeCurrentFile";
import { prettifyL2File } from "./prettifyL2File";
import { checkL2Version } from "./checkL2Version";

export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');

  // Level1 command pallette
  let executeCurrentFileDisposable = execCurL2File(context);
  context.subscriptions.push(executeCurrentFileDisposable);
  console.log(">>> executeCurrentFileDisposable is now active!");

  // Level1 command pallette
  let getremoteUrlFileDisposable = getRemoteUrl(context);
  context.subscriptions.push(getremoteUrlFileDisposable);
  console.log(">>> getremoteUrlFileDisposable is now active!");

  // Level1 command pallette
  let prettifyCurrentFileDisposable = prettifyL2File();
  context.subscriptions.push(prettifyCurrentFileDisposable);
  console.log(">>> prettifyCurrentFileDisposable is now active!");

  // Level1 command pallette
  let lama2Examples = genLama2Examples();
  console.log(">>> lama2Examples is now active!");

  // Level1 command pallette
  let generateCodeSnippetDisposable = genCodeSnip();
  context.subscriptions.push(generateCodeSnippetDisposable);
  console.log(">>> generateCodeSnippetDisposable is now active!");

  // Automatically check L2 version on extension activation
  checkL2Version();

  let suggestEnvVariables = suggestENVs();
  context.subscriptions.push(
    suggestEnvVariables,
    vscode.commands.registerCommand("envoptions", () => {
      // This method is activated when the user selects a suggested env variable.
      replaceTextAfterEnvSelected();
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }
