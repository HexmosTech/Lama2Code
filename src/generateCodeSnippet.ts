import * as vscode from "vscode";
import ChokiExtension from "./watchFile";
let fs = require("fs");
import { window } from "vscode";

class GenerateCodeSnippet {
  LAMA2_TERM_NAME = "AutoLama2";
  outPath: string = "";
  flagPath: string = "";

  getActiveTerminals() {
    return vscode.window.terminals;
  }

  findTerminalsByName(name: string) {
    let terminals = this.getActiveTerminals();
    let found = terminals.find((element) => element.name == name);
    return found;
  }

  findOrCreateTerminal(name: string) {
    let terminal = this.findTerminalsByName(name);
    if (terminal == null) {
      return vscode.window.createTerminal(name);
    } else {
      return terminal;
    }
  }

  getShowLam2Term(name: string) {
    let terminal = this.findOrCreateTerminal(name);
    terminal.show();
    return terminal;
  }

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
    let terminal = this.getShowLam2Term(this.LAMA2_TERM_NAME);
    let { cmd, rflag, rfile } = this.getLama2Command(lang, cli);
    this.outPath = rfile;
    this.flagPath = rflag;
    this.setLama2Watch();
    this.execLama2Command(terminal, cmd);
  }
}

export default GenerateCodeSnippet;
