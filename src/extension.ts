import * as vscode from "vscode";
import * as semver from "semver";
import * as child_process from "child_process";

import { genCodeSnip } from "./generateCodeSnippet";
import { getRemoteUrl } from "./getRemoteUrl";
import { genLama2Examples } from "./genLama2Examples";
import { execCurL2File } from "./executeCurrentFile";
import { prettifyL2File } from "./prettifyL2File";
import { getL2VersionAndUpdatePrompt } from "./checkL2Version";

import {
  exitLangServer,
  initializeLangServer,
  shutDownLangServer,
} from "./lsp/methods/lspLifecycles";
import {
  lama2RegisterCompletionItemProvider,
  triggerSuggestionInTemplateLiteral,
} from "./lsp/methods/suggestEnvironmentVars";
import { logToChannel } from "./lsp/response/generalResponse";

export const MIN_VERSION_TO_CHECK = "1.5.9";
let requestId = 1;

const langServer = child_process.spawn("l2", ["--lsp"]);

export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');

  initializeLangServer(langServer, requestId);
  getL2VersionAndUpdatePrompt(MIN_VERSION_TO_CHECK);

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

  // Therefore, we fetch variables from both the l2.env and l2config.env files for suggestions using this method.
  let suggestEnvVariables = lama2RegisterCompletionItemProvider(
    langServer,
    requestId
  );

  context.subscriptions.push(suggestEnvVariables);

  /**
   * Listens for text changes in the active document and triggers suggestion
   * if the cursor is within a template literal inside string quotes.
   *
   * This is needed because VS Code's native intellisense might not
   * automatically trigger suggestions within specific contexts like a
   * template literal inside string quotes.
   */
  const listener = triggerSuggestionInTemplateLiteral();
  context.subscriptions.push(listener);
}

export function deactivate() {
  shutDownLangServer(langServer, requestId);
  exitLangServer(langServer, requestId);
  logToChannel({ msg: "Extension deactivated" });
}
