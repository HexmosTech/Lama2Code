import * as vscode from "vscode";
import ChokiExtension from "./watchFile";
var Convert = require("ansi-to-html");
let fs = require("fs");
var path = require("path");
var json2html = require("json2html");
import splitLama2Output from "./parseOut";
import { getShowLama2Term } from "./utils";
import { MIN_VERSION_TO_CHECK } from "./extension";
import { getL2VersionAndUpdatePrompt } from "./checkL2Version";

class ExecuteCurrentFile {
  LAMA2_TERM_NAME = "AutoLama2";
  outPath: string = "";
  flagPath: string = "";
  panel: any;
  context: vscode.ExtensionContext;
  convert = new Convert({
    newline: true,
  });

  constructor(ctx: vscode.ExtensionContext) {
    this.context = ctx;
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

  getLama2Command() {
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
      randomNameFile = `${windowsBasePath}\\${randomNameBase}.json`;
      cmd = `powershell l2 -o ${randomNameFile} ${currentFilePath}; New-Item -Path ${randomNameFlag}`;
    } else {
      randomNameFlag = `/tmp/${randomNameBase}.flag`;
      randomNameFile = `/tmp/${randomNameBase}.json`;
      cmd = `l2 -o ${randomNameFile} ${currentFilePath}; touch ${randomNameFlag}`;
    }
    return {
      cmd: cmd,
      rflag: randomNameFlag,
      rfile: randomNameFile,
    };
  }

  getScriptTags(scripts: Array<string>) {
    let op: string = "";
    for (let s of scripts) {
      op += `<script src="${s}"></script>`;
    }
    return op;
  }

  getStyleTags(styles: Array<string>) {
    let op: string = "";
    for (let s of styles) {
      op += `<link rel="stylesheet" href="${s}"/>`;
    }
    return op;
  }

  createTable(headers) {
    let table = '<table>';

    headers.forEach(header => {
        let splitHeader = header.split(':');
        table += `<tr><td>${splitHeader[0]}</td><td>${splitHeader[1]}</td></tr>`;
    });

    table += '</table>';

    return table;
}

  getWrappedHtml(
    lama2LogHTML: string,
    httpHead: string,
    body: string,
    styles: Array<string>,
    scripts: Array<string>,
    responseTime: Array<Object>,
    statusCodes: Array<Object>,
    contentSizes:Array<Object>,
  ) {
    /*
        try {
            var j = JSON.parse(body)
            body = json2html.render(j, {plainHTML: true})
        } catch (e) {}
        */
    console.log(httpHead)
    httpHead = this.createTable(httpHead.split('<br/>'));
    let statusCode = statusCodes[1]["statusCode"];
    let contentSize = contentSizes[1]["sizeInBytes"];
    let responseTime1 = responseTime[1]["timeInMs"];
    return `${this.getStyleTags(styles)}
        <div class="status-info">
            <p>Status: <span class="${statusCode >= 200 && statusCode < 300 ? 'status-success' : 'status-error'}">${statusCode}</span></p>
            <p>Content-Size: <span class="${statusCode >= 200 && statusCode < 300 ? 'status-success' : 'status-error'}">${contentSize}bytes</span></p>
            <p>Time: <span class="${statusCode >= 200 && statusCode < 300 ? 'status-success' : 'status-error'}">${responseTime1}ms</span></p>
        </div>

       <ul data-tabs>
          <li><a  data-tabby-default href="#main">Response</a></li>
          <li><a  href="#httphead">Headers</a></li>
          <li><a  href="#elflog">Lama2 Logs</a></li>
      </ul>
      <div id="main">
          <div id="responsebody">${body}</div>
          <div id="wrapper"></div>
      </div>
      <div id="httphead">${httpHead}</div>
      <div id="elflog">${lama2LogHTML}</div>
        ${this.getScriptTags(scripts)}
        `;
  }

  getOrCreateWebPanel() {
    // TODO
  }

  getSpinnerFragment() {
    let spinner = `<style>
    .lds-dual-ring {
  display: inline-block;
  width: 80px;
  height: 80px;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}</style><div class="lds-dual-ring"></div>
`;
    return spinner;
  }

  getWebViewUri(filename: string) {
    const styleOnDiskPath = vscode.Uri.file(
      path.join(this.context.extensionPath, "media", filename)
    );
    return this.panel.webview.asWebviewUri(styleOnDiskPath);
  }

  postLama2Command() {
    let content = fs.readFileSync(this.outPath).toString();
    console.log("Content = ", content);
    let lama2Log, httpHead, body, performance, statusCodes, contentSizes;
    [lama2Log, httpHead, body, performance,statusCodes,contentSizes] = splitLama2Output(content);
    let responseTime = performance["responseTimes"];
    console.log("body1 = ", performance);
    let lama2LogHTML = this.convert.toHtml(lama2Log);
    let httpHeadHTML = this.convert.toHtml(httpHead);
    const stylesrc = this.getWebViewUri("style.css");
    const j2hstyle = this.getWebViewUri("index.css");
    const scriptsrc = this.getWebViewUri("script.js");
    const j2h = this.getWebViewUri("j2h-converter.js");

    const tabbyjs = this.getWebViewUri("tabby.polyfills.min.js");
    const tabbycss = this.getWebViewUri("tabby-ui.min.css");

    // const treestyle = this.getWebViewUri('jsonTree.css')
    // const jsonview = this.getWebViewUri('jsonview.js')

    const jquery = this.getWebViewUri("jquery.min.js");

    const styles = [stylesrc, j2hstyle, tabbycss];
    const scripts = [jquery, j2h, tabbyjs, scriptsrc];
    this.panel.webview.html = this.getWrappedHtml(
      lama2LogHTML,
      httpHeadHTML,
      body,
      styles,
      scripts,
      responseTime,
      statusCodes,
      contentSizes,
    );

    fs.unlinkSync(this.outPath);
    fs.unlinkSync(this.flagPath);
  }

  onLama2Finish(fp: any) {
    vscode.window.showInformationMessage(
      `Lama2 command completed according to ${fp}`
    );
    this.postLama2Command();
  }

  execLama2Command(lama2Term: vscode.Terminal, lama2Command: string) {
    console.log("lama2Term: ", lama2Term, "lama2Command: ", lama2Command);
    if (this.panel) {
      console.log("Reusing existing panel");
      this.panel.reveal();
    } else {
      console.log("Creating new panel");
      this.panel = vscode.window.createWebviewPanel(
        "lama2Output",
        "Lama2 Output",
        vscode.ViewColumn.Beside,
        {
          // Only allow the webview to access resources in our extension's media directory
          localResourceRoots: [
            vscode.Uri.file(path.join(this.context.extensionPath, "media")),
          ],
          enableFindWidget: true,
          enableScripts: true,
        }
      );
      this.panel.onDidDispose(
        () => {
          this.panel = undefined;
        },
        undefined,
        this.context.subscriptions
      );
      this.panel.webview.onDidReceiveMessage(
        (message: any) => {
          switch (message.command) {
            case "alert":
              vscode.window.showInformationMessage(message.text);
              return;
          }
        },
        undefined,
        this.context.subscriptions
      );
    }
    this.panel.webview.html = `<h2>Loading...</h2>${this.getSpinnerFragment()}`;
    lama2Term.sendText(lama2Command);
  }

  setLama2Watch() {
    let c = new ChokiExtension();
    c.pathAddTrigger(this.flagPath, this.onLama2Finish, this);
  }

  execFile() {
    getL2VersionAndUpdatePrompt(MIN_VERSION_TO_CHECK);
    let terminal = getShowLama2Term(this.LAMA2_TERM_NAME);
    let { cmd, rflag, rfile } = this.getLama2Command();
    this.outPath = rfile;
    this.flagPath = rflag;
    this.setLama2Watch();
    this.execLama2Command(terminal, cmd);
  }
}

export function execCurL2File(context: vscode.ExtensionContext) {
  let executeCurrentFile = new ExecuteCurrentFile(context);
  return vscode.commands.registerCommand("lama2.ExecuteCurrentFile", () =>
    executeCurrentFile.execFile()
  );
}
