import { commands, ExtensionContext } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { execCurL2File } from "@/commands/executecurrentfile/executeCurrentFile";


export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');

  let langServer = initializeLangServer(requestId);
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
  // const listener = triggerSuggestionInTemplateLiteral();
  // context.subscriptions.push(listener);
}

