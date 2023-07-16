import * as vscode from "vscode";
import { execSync } from "child_process";

import triggers from "./triggers";
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
    // const commandOutput = execSync(`./build/l2 --env ${l2FilePath}`, { cwd: "/home/lovestaco/repos/Lama2", }).toString(); // For local debugging 
    const commandOutput = execSync(`l2 --env ${l2FilePath}`).toString();

    const mapStartIndex = commandOutput.indexOf("{");
    const mapEndIndex = commandOutput.lastIndexOf("}");
    const envMapStr = commandOutput.substring(mapStartIndex, mapEndIndex + 1);

    const envMap = JSON.parse(envMapStr);
    return envMap;
  } catch (error) {
    console.error("Error executing the command:", error);
    return {};
  }
}

function createSuggestion(env: string, envVal: string, envSrc: string, position: any) {
  let item = new vscode.CompletionItem(
    env,
    vscode.CompletionItemKind.Text
  );
  item.detail = envVal;
  item.documentation = `src: ${envSrc}`;
  item.range = new vscode.Range(position, position);
  item.command = {
    title: "",
    command: "envoptions",
    arguments: [env],
  };
  return item;

}

export function suggestENVS() {
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