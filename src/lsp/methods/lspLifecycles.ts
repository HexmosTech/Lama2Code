import * as vscode from "vscode";
import { ChildProcess } from "child_process";
import {
  ILSPRequestDetails,
  sendRequestToLSPReadResponse,
} from "../request/generalRequest";

export function initlizeServer(langServer: ChildProcess, requestId: number) {
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
  sendRequestToLSPReadResponse(initLspReq);
}

export function exitLsp(langServer: ChildProcess, requestId: number) {
  requestId += 1;
  let exitReq: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "exit",
  };
  sendRequestToLSPReadResponse(exitReq);
}

export function shutDownLsp(langServer: ChildProcess, requestId: number) {
  requestId += 1;
  let shutdownReq: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "shutdown",
  };
  sendRequestToLSPReadResponse(shutdownReq);
}
