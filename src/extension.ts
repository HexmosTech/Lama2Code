import * as vscode from "vscode"
import { Lama2Panel } from "./panels/RequestPanel"
import { getRemoteUrl } from "./commands/RemoteUrl/getRemoteUrl"
import { prettifyL2File } from "./commands/PrettifyFile/prettifyL2File"
import { genCodeSnip } from "./commands/GenerateCode/generateCodeSnippet"
import { genLama2Examples } from "./commands/GenerateExamples/genLama2Examples"
import { getL2VersionAndUpdatePrompt } from "./utilities/checkL2Version"

/*LSP Related imports */
import { exitLangServer, initializeLangServer, shutDownLangServer } from "./lsp/methods/lspLifecycles"
import {
  lama2RegisterCompletionItemProvider,
  triggerSuggestionInTemplateLiteral,
} from "./lsp/methods/suggestEnvironmentVars"
import { logToChannel } from "./lsp/response/generalResponse"

/*constants */
export const MIN_VERSION_TO_CHECK = "1.5.9"
let REQUEST_ID = 1

export function activate(context: vscode.ExtensionContext) {
  let langServer = initializeLangServer(REQUEST_ID)
  getL2VersionAndUpdatePrompt(MIN_VERSION_TO_CHECK)

  context.subscriptions.push(
    vscode.commands.registerCommand("lama2.ExecuteCurrentFile", async () => {
      Lama2Panel.render(context.extensionUri)
      if (Lama2Panel.currentPanel) {
        await Lama2Panel.currentPanel.executeLama2Command(langServer)
      }
    })
  )
  let getremoteUrlFileDisposable = getRemoteUrl(context)
  context.subscriptions.push(getremoteUrlFileDisposable)
  console.log(">>> getremoteUrlFileDisposable is now active!")

  let prettifyCurrentFileDisposable = prettifyL2File()
  context.subscriptions.push(prettifyCurrentFileDisposable)
  console.log(">>> prettifyCurrentFileDisposable is now active!")

  let generateCodeSnippetDisposable = genCodeSnip(langServer)
  context.subscriptions.push(generateCodeSnippetDisposable)
  console.log(">>> generateCodeSnippetDisposable is now active!")

  let lama2Examples = genLama2Examples()
  console.log(">>> lama2Examples is now active!")

  // Therefore, we fetch variables from both the l2.env and l2config.env files for suggestions using this method.
  let suggestEnvVariables = lama2RegisterCompletionItemProvider(langServer, REQUEST_ID)

  context.subscriptions.push(suggestEnvVariables)

  /**
   * Listens for text changes in the active document and triggers suggestion
   * if the cursor is within a template literal inside string quotes.
   *
   * This is needed because VS Code's native intellisense might not
   * automatically trigger suggestions within specific contexts like a
   * template literal inside string quotes.
   */
  const listener = triggerSuggestionInTemplateLiteral()
  context.subscriptions.push(listener)
}

export function deactivate() {
  shutDownLangServer(REQUEST_ID)
  exitLangServer(REQUEST_ID)
  logToChannel({ msg: "Extension deactivated" })
}
