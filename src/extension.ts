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
  exitLsp as exitLangServer,
  initlizeServer as initlizeLangServer,
  shutDownLsp as shutDownLangServer,
} from "./lsp/methods/lspLifecycles";
import {
  getDotENVS,
  lama2RegisterCompletionItemProvider,
  replaceTextAfterEnvSelected,
  suggestENVSFromDotEnv,
  triggerSuggestionInTemplateLiteral,
} from "./lsp/methods/suggestEnvironmentVars";
import { logToChannel } from "./lsp/response/generalResponse";

export const MIN_VERSION_TO_CHECK = "1.5.8";
let requestId = 1;

const langServer = child_process.spawn("l2", ["--lsp"]);

export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');

  initlizeLangServer(langServer, requestId);

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
    /**
     * The L2 version, if less than v1.5.0, does not support the `l2 -e <filepath>` feature.
     * Therefore, we use the extension to fetch variables from the l2.env file for suggestions.
     */
    getDotENVS();
    suggestEnvVariables = suggestENVSFromDotEnv();
  } else {
    /**
     * L2 versions greater than or equal to v1.5.0 support the `l2 -e <filepath>` feature.
     * Therefore, we fetch variables from both the l2.env and l2config.env files for suggestions using this command.
     */
    suggestEnvVariables = lama2RegisterCompletionItemProvider(
      langServer,
      requestId
    );
  }

  context.subscriptions.push(
    suggestEnvVariables,
    /**
     * The following part is unnecessary for L2 versions > 1.5.0
     * This method is triggered when a user selects a suggested environment variable.
     */
    vscode.commands.registerCommand("envoptions", (selectedEnv: string) => {
      replaceTextAfterEnvSelected(selectedEnv);
    })
  );

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
