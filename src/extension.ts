import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import ExecuteCurrentFile from "./executeCurrentFile";
import GenerateCodeSnippet from "./generateCodeSnippet";
import LanguagesData from "./languages";
import { exec } from "child_process";
import triggers from "./triggers";

interface LanguageData {
  info: {
    key: string;
    title: string;
    extname: string;
    default: string;
  };
  clientsById: Record<string, null>;
}

interface LanguagesData {
  [key: string]: LanguageData;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');

  // Level1 command pallette
  let executeCurrentFile = new ExecuteCurrentFile(context);

  let executeCurrentFileDisposable = vscode.commands.registerCommand(
    "lama2.ExecuteCurrentFile",
    () => executeCurrentFile.execFile()
  );

  context.subscriptions.push(executeCurrentFileDisposable);

  // Level1 command pallette

  let prettifyCurrentFileDisposable = vscode.commands.registerCommand(
    "lama2.PrettifyCurrentFile",
    () => {
      console.log("Executing prettify command");
      exec(`l2 -b ${vscode.window.activeTextEditor?.document.fileName}`);
    }
  );
  context.subscriptions.push(prettifyCurrentFileDisposable);

  let generateCodeSnippet = new GenerateCodeSnippet();

  // Level1 command pallette
  let generateCodeSnippetDisposable = vscode.commands.registerCommand(
    "lama2.GenerateCodeSnippet",
    async () => {
      const langkwys = Object.keys(LanguagesData);
      let languageOptions: { [key: string]: string } = {};
      for (let i = 0; i < langkwys.length; i++) {
        const key = langkwys[i] as keyof typeof LanguagesData;
        const languageData = LanguagesData[key];
        languageOptions[languageData.info.title] = languageData.info.key;
      }

      const languageKeys = Object.keys(LanguagesData);

      // Level2 command pallette
      let language: string | undefined = await vscode.window.showQuickPick(
        Object.keys(languageOptions)
      );

      if (language) {
        language = languageOptions[language];
        const languageKey = languageKeys.find(
          (key) =>
            LanguagesData[key as keyof typeof LanguagesData].info.key ===
            language
        )!;

        const clientsById =
          LanguagesData[languageKey as keyof typeof LanguagesData].clientsById;
        const defaultClient =
          LanguagesData[languageKey as keyof typeof LanguagesData].info.default;

        const clientKeys = Object.keys(clientsById);

        if (clientKeys.length === 1) {
          const client = clientKeys[0];
          generateCodeSnippet.execFile(language, client);
        } else {
          // Level3 command pallette
          const selection:
            | {
                label: string;
                language: string;
                client: string;
              }
            | undefined = await vscode.window.showQuickPick(
            clientKeys
              .sort((a, b) =>
                a === defaultClient ? -1 : b === defaultClient ? 1 : 0
              )
              .map((client) => ({
                label: `${language ?? ""}: ${client} ${isDefault(
                  defaultClient,
                  client
                )}`,
                language: language ?? "",
                client: client,
              })),
            { placeHolder: "Select a client" }
          );

          if (selection) {
            generateCodeSnippet.execFile(selection.language, selection.client);
          }
        }
      }
    }
  );
  context.subscriptions.push(generateCodeSnippetDisposable);

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
    });
  }

  let suggestEnvVariables = vscode.languages.registerCompletionItemProvider(
    { language: "lama2", scheme: "file" },
    {
      // eslint-disable-next-line no-unused-vars
      provideCompletionItems(document, position, token, context) {
        let createSuggestion = (text: string) => {
          let item = new vscode.CompletionItem(
            text,
            vscode.CompletionItemKind.Text
          );
          item.range = new vscode.Range(position, position);
          return item;
        };

        const currentLine = document.lineAt(position.line).text;
        const triggerPrefix = currentLine
          .substring(0, position.character)
          .includes("${");
        const triggerPostfix = currentLine
          .substring(position.character)
          .includes("}");

        const suggestionsArray = envVariables.map((item, index) => {
          return createSuggestion(item);
        });

        if (triggerPrefix == true && triggerPostfix == false) {
          return suggestionsArray;
        } else if (triggerPrefix == true) {
          return suggestionsArray;
        } else {
          return [];
        }
      },
      ...triggers, // trigger
    }
  );
  context.subscriptions.push(suggestEnvVariables);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function isDefault(defaultClient: string, client: string) {
  if (defaultClient == client) {
    return "(Default)";
  } else {
    return "";
  }
}
