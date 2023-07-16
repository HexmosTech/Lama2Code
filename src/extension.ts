import * as vscode from "vscode";
import { exec } from "child_process";

import ExecuteCurrentFile from "./executeCurrentFile";
import GenerateCodeSnippet from "./generateCodeSnippet";
import GetRemoteURL from "./getRemoteUrl";
import LanguagesData from "./languages";
import { replaceTextAfterEnvSelected, suggestENVS } from "./suggestEnvironmentVars";

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

let examplesJSONStr =
  '{"0006_cookies.l2":"POST \\nhttps://httpbin.org/post\\n\\n# HEADERS\\nCookie:\\"sessionid=foo;another-cookie=bar\\"\\n\\nHeader1:value1\\nHeader2: Value2\\n\\n# DATA\\nhello=world","0002_sample_post.l2":"POST\\nhttps://httpbin.org/post\\n\\n{\\n  \\"a\\": \\"b\\",\\n  \\"c\\": \\"d\\"\\n}","0005_headers_simple.l2":"POST \\nhttps://httpbin.org/post\\n\\n# HEADERS\\nX-Parse-Application-Id:\'helloworld\'\\nX-Parse-REST-API-Key:\\"byeworld\\"\\n\\n# DATA\\na=\\"b\\"  # double-quoted string\\n\'c\'=d  # single-quoted & unquoted strings","0008_base64_image":{"0008_base64_image.l2":"POST\\nhttp://httpbin.org/post\\n\\n{\\n\\t\\"imageb64_field\\": \\"\'${PHOTO}\'\\",\\n}","l2.env":"\\nexport PHOTO=`base64 image.jpeg`"},"0001_sample_post_varjson.l2":"POST\\nhttps://httpbin.org/post\\n\\na=b\\nc=d","0007_multipart_file":{"0007_multipart_file.l2":"POST\\nMULTIPART\\nhttp://httpbin.org/post\\n\\n\'X-Parse-Application-Id\':helloworld \\nX-Parse-REST-API-Key:\\"helloworld\\"\\n\\n# DATA\\nfirst=second\\n\\n# FILES\\nmyfile@./image.jpeg"},"0004_env_switch_root":{"0004_env_switch_root.l2":"POST\\n${REMOTE}/post\\n\\n{\\n    \\"lorem\\": \\"ipsum\\"\\n}","l2.env":"export LOCAL=\\"http://localhost:8000\\"\\nexport REMOTE=\\"http://httpbin.org\\""},"0003_comment.l2":"# Pound symbol signifies a comment\\nPOST\\nhttps://httpbin.org/post\\n\\na=b # Comments may start at the end of lines as well\\nc=d\\n\\n# Comments work even after the payload","0000_sample_get.l2":"GET\\nhttps://httpbin.org/get","0009_processor_basic":{"0009_processor_basic.l2":"url = \\"http://google.com\\"\\n---\\n# stage 1\\n\\nPOST\\n${REMOTE_COORD}/anything\\n\\n{\\n    \\"username\\": \\"admin\\",\\n    \\"password\\": \\"Password@123\\",\\n    \\"from\\": \\"${LOCAL_COORD}/anything\\",\\n    \\"url\\": \\"${url}\\",\\n    \\"Token\\": \\"MySuperSecretToken\\"\\n}\\n\\n---\\n\\n// filtering, store in var\\nconsole.log(\\"@@Result\\", result)\\nlet TOKEN = result[\\"json\\"][\\"Token\\"]\\nconsole.log(TOKEN)\\n\\n---\\n\\n# stage 2\\nGET\\n${REMOTE_COORD}/bearer\\n\\nAuthorization: \'Bearer ${TOKEN}\'\\n\\n{}","l2.env":"\\nexport LOCAL_COORD=\\"http://localhost:8080\\"\\nexport REMOTE_COORD=\\"http://httpbin.org\\""}}';
let examplesJSON = JSON.parse(examplesJSONStr);
let specificExGlobal = "";
let subSpecificExGlobal = "";


function execCurL2File(context: vscode.ExtensionContext) {
  let executeCurrentFile = new ExecuteCurrentFile(context);
  return vscode.commands.registerCommand("lama2.ExecuteCurrentFile", () =>
    executeCurrentFile.execFile()
  );
}

function getRemoteUrl(context: vscode.ExtensionContext) {
  let getremoteUrl = new GetRemoteURL(context);
  console.log(getremoteUrl);
  let getremoteUrlFileDisposable = vscode.commands.registerCommand(
    "lama2.GetRemoteURL",
    () => getremoteUrl.findURL()
  );
  return getremoteUrlFileDisposable;
}

function prettifyL2File() {
  return vscode.commands.registerCommand("lama2.PrettifyCurrentFile", () => {
    console.log("Executing prettify command");
    exec(`l2 -b ${vscode.window.activeTextEditor?.document.fileName}`);
  });
}

function genLama2Examples() {
  return vscode.commands.registerCommand("lama2.Lama2Examples", async () => {
    let specificEx: string | undefined = await vscode.window.showQuickPick(
      Object.keys(examplesJSON)
    );

    if (specificEx) {
      specificExGlobal = specificEx;
      if (specificEx.endsWith(".env") || specificEx.endsWith(".l2")) {
        vscode.window.activeTextEditor?.edit((builder) => {
          const doc = vscode.window.activeTextEditor?.document;
          builder.replace(
            new vscode.Range(
              doc!.lineAt(0).range.start,
              doc!.lineAt(doc!.lineCount - 1).range.end
            ),
            examplesJSON[specificExGlobal]
          );
        });
        return;
      }

      let subSpecificEx: string | undefined = await vscode.window.showQuickPick(
        Object.keys(examplesJSON[specificEx])
      );

      if (subSpecificEx) {
        subSpecificExGlobal = subSpecificEx;
        vscode.window.activeTextEditor?.edit((builder) => {
          const doc = vscode.window.activeTextEditor?.document;
          builder.replace(
            new vscode.Range(
              doc!.lineAt(0).range.start,
              doc!.lineAt(doc!.lineCount - 1).range.end
            ),
            examplesJSON[specificExGlobal][subSpecificExGlobal]
          );
        });
        return;
      }
    }
  });
}

function isDefault(defaultClient: string, client: string) {
  if (defaultClient == client) {
    return "(Default)";
  } else {
    return "";
  }
}

function genCodeSnip() {
  let generateCodeSnippet = new GenerateCodeSnippet();
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
  return generateCodeSnippetDisposable;
}


export function activate(context: vscode.ExtensionContext) {
  console.log('>>> Congratulations, your extension "Lama2" is now active!');

  // Level1 command pallette
  let executeCurrentFileDisposable = execCurL2File(context);
  context.subscriptions.push(executeCurrentFileDisposable);
  console.log(">>> executeCurrentFileDisposable is now active!");

  // Level1 command pallette
  let getremoteUrlFileDisposable = getRemoteUrl(context);
  context.subscriptions.push(getremoteUrlFileDisposable);
  console.log(">>> getremoteUrlFileDisposable is now active!");

  // Level1 command pallette
  let prettifyCurrentFileDisposable = prettifyL2File();
  context.subscriptions.push(prettifyCurrentFileDisposable);
  console.log(">>> prettifyCurrentFileDisposable is now active!");

  // Level1 command pallette
  let lama2Examples = genLama2Examples();
  console.log(">>> lama2Examples is now active!");

  // Level1 command pallette
  let generateCodeSnippetDisposable = genCodeSnip();
  context.subscriptions.push(generateCodeSnippetDisposable);
  console.log(">>> generateCodeSnippetDisposable is now active!");

  let suggestEnvVariables = suggestENVS();
  context.subscriptions.push(
    suggestEnvVariables,
    vscode.commands.registerCommand("envoptions", () => {
      // This method is activated when the user selects a suggested env variable.
      replaceTextAfterEnvSelected();
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }
