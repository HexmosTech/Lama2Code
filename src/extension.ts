import * as vscode from "vscode";
import * as semver from "semver";

import { genCodeSnip } from "./generateCodeSnippet";
import { getRemoteUrl } from "./getRemoteUrl";
import {
  getDotENVS,
  replaceTextAfterEnvSelected,
  suggestENVSFromDotEnv,
  suggestENVs,
} from "./suggestEnvironmentVars";
import { genLama2Examples } from "./genLama2Examples";
import { execCurL2File } from "./executeCurrentFile";
import { prettifyL2File } from "./prettifyL2File";
import { getL2VersionAndUpdatePrompt } from "./checkL2Version";

const MIN_VERSION_TO_CHECK = "1.5.2";

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
  let suggestEnvVariables: any;
  let l2Version = getL2VersionAndUpdatePrompt(MIN_VERSION_TO_CHECK);
  if (
    l2Version === null ||
    l2Version === undefined ||
    semver.lt(l2Version, MIN_VERSION_TO_CHECK)
  ) {
    getDotENVS();
    suggestEnvVariables = suggestENVSFromDotEnv();
  } else {
    suggestEnvVariables = suggestENVs();
  }

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
