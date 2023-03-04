import * as vscode from "vscode";
import ExecuteCurrentFile from "./executeCurrentFile";
import GenerateCodeSnippet from "./generateCodeSnippet";
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
