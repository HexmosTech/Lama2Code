import * as vscode from "vscode";
import { ChildProcess, execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import triggers from "./triggers";
import { IJSONRPCResponse, logToChannel } from "./lsp/utils";
import { getEnvsFromLsp } from "./lsp/methods/lspSuggestEnvs";

let envVars = [] as string[];
let cursorPosition = 0;

type EnvVarObject = {
  [key: string]: {
    src: string;
    val: string;
  };
};

function createSuggestion(
  env: string,
  envVal: string,
  envSrc: string,
  position: vscode.Position
) {
  let item = new vscode.CompletionItem(env, vscode.CompletionItemKind.Variable);
  item.detail = `${envVal} (src: ${envSrc})`;
  item.range = new vscode.Range(position, position);
  item.command = {
    title: "",
    command: "envoptions",
    arguments: [env],
  };
  return item;
}

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

function isCursorInsideTemplateLiteral(
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

      if (isCursorInsideTemplateLiteral(lineText, cursorPosition.character)) {
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

      const typedEnvArg = currentLine.substring(
        openingBraceIndex + 2,
        cursorIndex
      );

      const response: IJSONRPCResponse = await getEnvsFromLsp(
        langServer,
        requestId,
        document,
        position,
        typedEnvArg
      );
      logToChannel({
        msg: "Received envs from server",
        dataObject: response,
      });
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

export function replaceTextAfterEnvSelected(selectedEnv: string) {
  console.log("Replacing text after env selected...");
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    let position = editor.selection.active;
    let lineText = editor.document.lineAt(position.line).text;
    let cursorIndex = position.character;

    let [openingBraceIndex, closingBraceIndex] = getBraceIndicesOfCurLine(
      lineText,
      cursorIndex
    );
    let isInsidePlaceholder = isCursorInsidePlaceholder(
      openingBraceIndex,
      closingBraceIndex
    );

    if (isInsidePlaceholder) {
      let edit = new vscode.WorkspaceEdit();
      let range = new vscode.Range(
        position.line,
        openingBraceIndex + 2,
        position.line,
        closingBraceIndex
      );
      edit.replace(editor.document.uri, range, selectedEnv);
      vscode.workspace.applyEdit(edit);
    }
  }
}

// Old functionalities to fetch variables and show by reading the l2.env
function getEnvFromL2DotEnv(): string[] {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return [];
  }

  const l2FilePath = editor.document.fileName;
  if (!l2FilePath.endsWith(".l2")) {
    return [];
  }

  const l2FileDir = path.dirname(l2FilePath);
  const envFilePath = path.join(l2FileDir, "l2.env");

  if (!fs.existsSync(envFilePath)) {
    vscode.window.showInformationMessage(
      "Could not find 'l2.env' file to suggest variables, sorry."
    );
    return [];
  }

  const envFileContent = fs.readFileSync(envFilePath, "utf-8");
  const envVarRegex = /^export\s+([^\s=]+)=/gm;

  const envVars: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = envVarRegex.exec(envFileContent))) {
    envVars.push(match[1]);
  }

  return envVars;
}

export function getDotENVS() {
  return vscode.workspace.onDidChangeTextDocument((event) => {
    let editor = vscode.window.activeTextEditor;
    if (
      editor &&
      event.document === editor.document &&
      event.contentChanges.length > 0
    ) {
      // Check if the file has an extension of .l2
      if (event.document.fileName.endsWith(".l2")) {
        // Check if the cursor is in between these ${} by using regular expressions
        let currentLine = editor.document.lineAt(editor.selection.active.line);
        let cursorPosition = editor.selection.active.character;
        let lineText = currentLine.text;
        let regex = /\${.*/g;
        let match = regex.exec(lineText);
        while (match) {
          let matchIndex = match.index + currentLine.range.start.character;
          if (
            cursorPosition > matchIndex &&
            cursorPosition < matchIndex + match[0].length
          ) {
            let cursorPos = cursorPosition + 1;
            cursorPosition = cursorPos;
            envVars = getEnvFromL2DotEnv();
            console.log("Environment variables:", envVars);
            // envVars looks like this ['zzz', 'KARMA_CORE_URL', 'third', 'fourth', 'fifth']
            break;
          }
          match = regex.exec(lineText);
        }
      }
    }
  });
}

export function suggestENVSFromDotEnv() {
  return vscode.languages.registerCompletionItemProvider(
    { language: "lama2", scheme: "file" },
    {
      // eslint-disable-next-line no-unused-vars
      provideCompletionItems(document, position, token, context) {
        const currentLine = document.lineAt(position.line).text;
        const triggerPrefix = currentLine
          .substring(0, position.character)
          .includes("${");
        const triggerPostfix = currentLine
          .substring(position.character)
          .includes("}");

        const suggestionsArray = envVars.map((env, index) => {
          return createSuggestion(env, "", "l2.env", position);
        });

        if (triggerPrefix === true && triggerPostfix === false) {
          return suggestionsArray;
        } else if (triggerPrefix === true) {
          return suggestionsArray;
        } else {
          return [];
        }
      },
      ...triggers, //triggers for activating the suggestions
      resolveCompletionItem(
        item: vscode.CompletionItem,
        token: vscode.CancellationToken
      ) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const position = editor.selection.active;
          cursorPosition = position.character;
        }
        return item;
      },
    }
  );
}
