import * as vscode from "vscode";
import { ILSPRequestDetails, askLSP } from "../request/generalRequest";
import * as child_process from "child_process";

const langServer = child_process.spawn("l2", ["--lsp"]);

export function initializeLangServer(
  requestId: number
) {
  let initLspReq: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "initialize",
    params: {
      processId: process.pid,
      rootUri: vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.toString()
        : undefined,
      workspace: {
        workspaceFolders: {
          supported: false,
          changeNotifications: false,
        },
      },
      clientInfo: {
        name: vscode.env.appName,
        version: vscode.version,
      },
    },
  };
  askLSP(initLspReq);
  return langServer
}

export function exitLangServer(requestId: number) {
  requestId += 1;
  let exitReq: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "exit",
  };
  askLSP(exitReq);
}

export function shutDownLangServer(
  requestId: number
) {
  requestId += 1;
  let shutdownReq: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "shutdown",
  };
  askLSP(shutdownReq);
}
