import * as vscode from "vscode";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import triggers from "./triggers";

let envVars = [] as string[];
let cursorPosition = 0;

export function getEnvsFromEnvCommand(typedEnvArg: string): {} {
  console.log("Entering getEnvsFromEnvCommand with arg:", typedEnvArg);
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return {};
  }

  const l2FilePath = editor.document.fileName;
  if (!l2FilePath.endsWith(".l2")) {
    return {};
  }

  try {
    // Execute the command and read the stdout for JSON of all the env's

    // const commandOutput = execSync(
    //   `./build/l2 --env=${typedEnvArg} ${l2FilePath}`,
    //   { cwd: "/home/lovestaco/repos/Lama2" }
    // ).toString(); // For local debugging
    const commandOutput = execSync(`l2 --env=${typedEnvArg} ${l2FilePath}`).toString();
    const envMap = JSON.parse(commandOutput);
    return envMap;
  } catch (error) {
    console.error("Error executing the command:", error);
    return {};
  }
}

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

function isCursorInsidePlaceholder(openingBraceIndex: number, closingBraceIndex: number): boolean {
  console.log("Checking if cursor is inside placeholder...");
  const isInside = (openingBraceIndex >= 0 && closingBraceIndex > openingBraceIndex);
  return isInside;
}

function getBraceIndicesOfCurLine(currentLine: string, cursorIndex: number): [number, number] {
  console.log("Getting brace indices for current line...");
  const openingBraceIndex = currentLine.lastIndexOf("${", cursorIndex);
  const closingBraceIndex = currentLine.indexOf("}", cursorIndex);
  return [openingBraceIndex, closingBraceIndex];
}


function createSuggestionsArray(
  envVarsObj: Record<string, { src: string; val: string }>,
  position: vscode.Position
): vscode.CompletionItem[] {
  console.log("Creating suggestions array...");
  // Convert the object into a Map for easier iteration
  const envVars = new Map(Object.entries(envVarsObj));

  // Map each entry in the Map to a completion suggestion
  const suggestionsArray = Array.from(envVars.entries()).map(([env, meta]) => {
    const suggestion = createSuggestion(env, meta.val, meta.src, position);
    return suggestion;
  });

  return suggestionsArray;
}


function getTriggerPrefixAndPostfix(currentLine: string, cursorPosition: number): [boolean, boolean] {
  console.log("Getting trigger prefix and postfix...");
  const triggerPrefix = currentLine.substring(0, cursorPosition).includes("${");
  const triggerPostfix = currentLine.substring(cursorPosition).includes("}");
  return [triggerPrefix, triggerPostfix];
}

export function suggestENVs() {
  console.log("Setting up ENVs suggestion...");
  return vscode.languages.registerCompletionItemProvider(
    { language: "lama2", scheme: "file" },
    {
      provideCompletionItems(document, position) {
        const currentLine = document.lineAt(position.line).text;
        const cursorIndex = position.character;
        console.log("Current Line:", currentLine, "Cursor Index:", cursorIndex);

        const [openingBraceIndex, closingBraceIndex] = getBraceIndicesOfCurLine(currentLine, cursorIndex);
        const isInsidePlaceholder = isCursorInsidePlaceholder(openingBraceIndex, closingBraceIndex)

        if (isInsidePlaceholder) {
          const typedEnvArg = currentLine.substring(openingBraceIndex + 2, cursorIndex);
          const envVarsObj = getEnvsFromEnvCommand(typedEnvArg);
          const suggestionsArray = createSuggestionsArray(envVarsObj, position);
          const [triggerPrefix, triggerPostfix] = getTriggerPrefixAndPostfix(currentLine, cursorIndex);
          if (triggerPrefix) {
            return suggestionsArray;
          }
        }
        return [];
      },
      ...triggers,
      resolveCompletionItem(item: vscode.CompletionItem) {
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


export function replaceTextAfterEnvSelected(selectedEnv: string) {
  console.log("Replacing text after env selected...");
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    let position = editor.selection.active;
    let lineText = editor.document.lineAt(position.line).text;
    let cursorIndex = position.character;

    let [openingBraceIndex, closingBraceIndex] = getBraceIndicesOfCurLine(lineText, cursorIndex);
    let isInsidePlaceholder = isCursorInsidePlaceholder(openingBraceIndex, closingBraceIndex)

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