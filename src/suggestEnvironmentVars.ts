import * as vscode from "vscode";
import { execSync } from "child_process";
import * as path from 'path';
import * as fs from 'fs';
import triggers from "./triggers";

let envVars = [] as string[];
let cursorPosition = 0;

export function getEnvsFromEnvCommand(): {} {
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

    // const commandOutput = execSync(`./build/l2 --env ${l2FilePath}`, { cwd: "/home/lovestaco/repos/Lama2", }).toString(); // For local debugging 
    const commandOutput = execSync(`l2 --env ${l2FilePath}`).toString();
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
  let item = new vscode.CompletionItem(
    env,
    vscode.CompletionItemKind.Variable
  );
  item.detail = `${envVal} (src: ${envSrc})`;
  item.range = new vscode.Range(position, position);
  item.command = {
    title: "",
    command: "envoptions",
    arguments: [env],
  };
  return item;
}

export function suggestENVs() {
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

        const envVarsObj = getEnvsFromEnvCommand() as Record<
          string,
          { src: string; val: string }
        >; // Explicitly cast to the correct type
        const envVars = new Map(Object.entries(envVarsObj));

        const suggestionsArray = Array.from(envVars.entries()).map(
          ([env, meta]) => createSuggestion(env, meta.val, meta.src, position)
        );

        if (triggerPrefix && !triggerPostfix) {
          return suggestionsArray;
        } else if (triggerPrefix) {
          return suggestionsArray;
        } else {
          return [];
        }
      },
      ...triggers, // triggers for activating the suggestions
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

export function replaceTextAfterEnvSelected() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    let position = editor.selection.active;
    let lineText = editor.document.lineAt(position.line).text;
    let linePosition = editor.document.lineAt(position.line).range.start
      .character;
    let openingBraceIndex = lineText.indexOf("{", linePosition);
    if (openingBraceIndex >= 0 && cursorPosition > openingBraceIndex) {
      let newText = lineText.substring(0, openingBraceIndex + 1);
      newText += lineText.substring(cursorPosition);
      let edit = new vscode.WorkspaceEdit();
      let range = new vscode.Range(
        position.line,
        0,
        position.line,
        lineText.length
      );
      edit.replace(editor.document.uri, range, newText);
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