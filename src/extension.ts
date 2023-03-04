import * as vscode from "vscode";
import ExecuteCurrentFile from "./executeCurrentFile";
import LanguagesData from "./languages";

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
  let generateCodeSnippetDisposable = vscode.commands.registerCommand(
    "lama2.GenerateCodeSnippet",
    async () => {
      const languageKeys = Object.keys(LanguagesData);

      // Level2 command pallette
      const language: string | undefined = await vscode.window.showQuickPick(
        languageKeys.map(
          (key) => LanguagesData[key as keyof typeof LanguagesData].info.title
        )
      );

      if (language) {
        const languageKey = languageKeys.find(
          (key) =>
            LanguagesData[key as keyof typeof LanguagesData].info.title ===
            language
        )!;
        const clientsById =
          LanguagesData[languageKey as keyof typeof LanguagesData].clientsById;
        console.log(clientsById);
        const defaultClient =
          LanguagesData[languageKey as keyof typeof LanguagesData].info.default;

        const clientKeys = Object.keys(clientsById);

        if (clientKeys.length === 1) {
          const client = clientKeys[0];
          console.log("Convert ", language, client);
        } else {
          // Level3 command pallette
          const selection:
            | {
                label: string;
                language: string;
                client: string;
              }
            | undefined = await vscode.window.showQuickPick(
            clientKeys.map((client) => ({
              label: `${language}: ${client} ${isDefault(
                defaultClient,
                client
              )}`,
              language: language,
              client: client,
            }))
          );

          if (selection) {
            console.log("Convert ", selection.language, selection.client);
          }
        }
      }
    }
  );
  context.subscriptions.push(generateCodeSnippetDisposable);
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
