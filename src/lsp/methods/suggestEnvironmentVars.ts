import * as vscode from "vscode";
import { ChildProcess, execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import triggers from "../../triggers";
import {
  ErrorCodes,
  IJSONRPCResponse,
  logToChannel,
} from "../response/generalResponse";
import { getEnvsFromLsp } from "../request/suggestEnvVarsRequest";

type EnvVarObject = {
  [key: string]: {
    src: string;
    val: string;
  };
};

function isCursorInsidePlaceholder(
  openingBraceIndex: number,
  closingBraceIndex: number
): boolean {
  console.log("Checking if cursor is inside placeholder...");
  const isInside =
    openingBraceIndex >= 0 && closingBraceIndex > openingBraceIndex;
  return isInside;
}

function getBraceIndicesOfCurLine(
  currentLine: string,
  cursorIndex: number
): [number, number] {
  console.log("Getting brace indices for current line...");
  const openingBraceIndex = currentLine.lastIndexOf("${", cursorIndex);
  const closingBraceIndex = currentLine.indexOf("}", cursorIndex);
  return [openingBraceIndex, closingBraceIndex];
}

function createSuggestionsArray(
  envVarsObj: EnvVarObject
): vscode.CompletionItem[] {
  return Object.entries(envVarsObj).map(([env, data]) => {
    const completionItem = new vscode.CompletionItem(env);
    completionItem.documentation = new vscode.MarkdownString()
      .appendText(`Source: ${data.src}\n`)
      .appendText(`Value: ${data.val}`);
    completionItem.detail = "Press Ctrl + Space for docs.";
    return completionItem;
  });
}

function isCursorInsideStringVarContainer(
  lineText: string,
  cursorCharacter: number
): boolean {
  let insideTemplateLiteral = false;
  let insideStringQuotes = false;

  let lastQuoteIndex = lineText.lastIndexOf('"', cursorCharacter - 1);
  let nextQuoteIndex = lineText.indexOf('"', cursorCharacter);

  if (lastQuoteIndex !== -1 && nextQuoteIndex !== -1) {
    insideStringQuotes = true;
  }

  for (let i = 0; i < cursorCharacter; i++) {
    if (lineText[i] === "$" && lineText[i + 1] === "{" && insideStringQuotes) {
      insideTemplateLiteral = true;
    }

    if (lineText[i] === "}") {
      insideTemplateLiteral = false;
    }
  }
  return insideTemplateLiteral;
}

export function triggerSuggestionInTemplateLiteral() {
  return vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      const cursorPosition = editor.selection.active;
      const lineText = editor.document.lineAt(cursorPosition.line).text;

      if (
        isCursorInsideStringVarContainer(lineText, cursorPosition.character)
      ) {
        // Manually trigger suggestions
        vscode.commands.executeCommand("editor.action.triggerSuggest");
      }
    }
  });
}

export function lama2ProvideCompletionItems(
  langServer: ChildProcess,
  requestId: number
) {
  return {
    async provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position
    ): Promise<vscode.CompletionItem[]> {
      requestId += 1;
      const currentLine = document.lineAt(position.line).text;
      const cursorIndex = position.character;

      const [openingBraceIndex, closingBraceIndex] = getBraceIndicesOfCurLine(
        currentLine,
        cursorIndex
      );

      const searchQuery = currentLine.substring(
        openingBraceIndex + 2,
        cursorIndex
      );

      const response: IJSONRPCResponse = await getEnvsFromLsp(
        langServer,
        requestId,
        document,
        position,
        searchQuery
      );
      logToChannel({
        msg: "Received envs from server",
        dataObject: response,
      });
      // Check if there's an error in the response
      handleErrorsForSuggestEnvs(response);
      const envVarsObj: EnvVarObject = response.result;
      const isInsidePlaceholder = isCursorInsidePlaceholder(
        openingBraceIndex,
        closingBraceIndex
      );

      if (isInsidePlaceholder) {
        const completions: vscode.CompletionItem[] =
          createSuggestionsArray(envVarsObj);

        return completions;
      }
      return [];
    },
  };
}

function handleErrorsForSuggestEnvs(response: IJSONRPCResponse) {
  if (response.error) {
    switch (response.error.code) {
      case ErrorCodes.ERR_INVALID_REQUEST:
        vscode.window.showErrorMessage(
          "Invalid JSON-RPC request: " + response.error.message
        );
        break;
      case ErrorCodes.ERR_UNSUPPORTED_FEATURE:
        vscode.window
          .showErrorMessage(response.error.message, "Visit GitHub")
          .then((selected) => {
            if (selected === "Visit GitHub") {
              vscode.env.openExternal(
                vscode.Uri.parse("https://github.com/HexmosTech/Lama2")
              );
            }
          });
        break;
      case ErrorCodes.ERR_INVALID_AFTER_SHUTDOWN:
        vscode.window.showErrorMessage(
          "Invalid request after shutdown: " + response.error.message
        );
        break;
      default:
        vscode.window.showErrorMessage(
          "Unknown error: " + response.error.message
        );
    }
  }
}

export function lama2RegisterCompletionItemProvider(
  langServer: ChildProcess,
  requestId: number
) {
  console.log("Setting up ENVs suggestion...");
  // Registering a completion provider.
  return vscode.languages.registerCompletionItemProvider(
    // The '*' indicates that this provider will suggest completions for any type of file (language).
    // But since we are activating the extension only on language lama2,
    // The intellisense will add all the words to the completion item list.
    // Which is helpful as we have JS blocks support in the file.
    "*",
    lama2ProvideCompletionItems(langServer, requestId)
  );
}
