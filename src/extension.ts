import { commands, ExtensionContext } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { execCurL2File } from "./commands/executecurrentfile/executeCurrentFile";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');

  // Level1 command pallette
  let executeCurrentFileDisposable = execCurL2File(context);
  context.subscriptions.push(executeCurrentFileDisposable);
  console.log(">>> executeCurrentFileDisposable is now active!");



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

