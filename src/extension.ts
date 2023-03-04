import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');
  let envVariables = [] as string[];
  const activeTextEditor = vscode.window.activeTextEditor;
  if (activeTextEditor) {
    const activeFilePath = activeTextEditor.document.uri.fsPath;
    const envFilePath = path.join(path.dirname(activeFilePath), "l2.env");
    fs.readFile(envFilePath, "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      envVariables = data
        .split("\n")
        .filter((line) => line.startsWith("export"))
        .map((line) => line.split("=")[0].replace("export ", ""));
      console.log("envVariables -> ", envVariables);
    });
  }

  let suggestEnvVariables = vscode.languages.registerCompletionItemProvider(
    { language: "lama2", scheme: "file" },
    {
      // eslint-disable-next-line no-unused-vars
      provideCompletionItems(document, position, token, context) {
        // get all text until the `position` and check if it reads `${`

        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character);
        if (!linePrefix.endsWith("${")) {
          return undefined;
        }
        let createSuggestion = (text: string) => {
          let item = new vscode.CompletionItem(
            text,
            vscode.CompletionItemKind.Text
          );
          item.range = new vscode.Range(position, position);
          return item;
        };
        const suggestionsArray = envVariables.map((item, index) => {
          return createSuggestion(item);
        });

        return suggestionsArray;
      },
    },
    "{" // trigger
  );
  context.subscriptions.push(suggestEnvVariables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
