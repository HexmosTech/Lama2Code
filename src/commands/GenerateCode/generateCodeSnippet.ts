import * as vscode from "vscode";
import ChokiExtension from "../../utilities/watchFile";
let fs = require("fs");
import { window } from "vscode";
import LanguagesData from "./languages";
import { getShowLama2Term } from "../../utilities/utils";

class GenerateCodeSnippet {
  LAMA2_TERM_NAME = "AutoLama2";
  outPath: string = "";
  flagPath: string = "";

  generateRandomName(length: any) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  getLama2Command(lang: string, cli: string) {
    let randomNameFile = null;
    let randomNameFlag = null;
    let cmd = null;
    let windowsBasePath = "C:\\ProgramData\\.lama2";
    let randomNameBase = this.generateRandomName(8);
    let currentFilePath = vscode.window.activeTextEditor?.document.fileName;

    if (process.platform === "win32") {
      if (!fs.existsSync(windowsBasePath)) {
        fs.mkdirSync(windowsBasePath);
      }
      randomNameFlag = `${windowsBasePath}\\${randomNameBase}.flag`;
      randomNameFile = `${windowsBasePath}\\${randomNameBase}.txt`;
      cmd = `powershell l2 -c ${lang}.${cli} ${currentFilePath} > ${randomNameFile}; New-Item -Path ${randomNameFlag}`;
    } else {
      randomNameFlag = `/tmp/${randomNameBase}.flag`;
      randomNameFile = `/tmp/${randomNameBase}.txt`;
      cmd = `l2 -c ${lang}.${cli} ${currentFilePath} > ${randomNameFile}; touch ${randomNameFlag}`;
    }

    return {
      cmd: cmd,
      rflag: randomNameFlag,
      rfile: randomNameFile,
    };
  }

  postLama2Command() {
    let content = fs.readFileSync(this.outPath).toString();
    if (content === "false" || content === false || content.includes("Error")) {
      window.showInformationMessage("Something went wrong. Retry.");
    } else {
      if (content.includes("Code copied to clipboard")) {
        content = content.replace("Code copied to clipboard", "");
      }
      vscode.env.clipboard.writeText(content.toString());
      window.showInformationMessage("Copied code snippet to clipboard.");
    }
    fs.unlinkSync(this.outPath);
    fs.unlinkSync(this.flagPath);
  }

  onLama2Finish(fp: any) {
    this.postLama2Command();
  }

  execLama2Command(lama2Term: vscode.Terminal, lama2Command: string) {
    lama2Term.sendText(lama2Command);
  }

  setLama2Watch() {
    let c = new ChokiExtension();
    c.pathAddTrigger(this.flagPath, this.onLama2Finish, this);
  }

  execFile(lang: string, cli: string) {
    let terminal = getShowLama2Term(this.LAMA2_TERM_NAME);
    let { cmd, rflag, rfile } = this.getLama2Command(lang, cli);
    this.outPath = rfile;
    this.flagPath = rflag;
    this.setLama2Watch();
    this.execLama2Command(terminal, cmd);
  }
}

function isDefault(defaultClient: string, client: string) {
  if (defaultClient == client) {
    return "(Default)";
  } else {
    return "";
  }
}

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

export function genCodeSnip() {
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
