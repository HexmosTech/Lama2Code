import * as vscode from "vscode";
import { ChildProcess } from "child_process";
import { ILSPRequestDetails, askLSP } from "./generalRequest";
import { IJSONRPCResponse } from "../response/generalResponse";

export async function getEnvsFromLsp(
  langServer: ChildProcess,
  requestId: number,
  document: vscode.TextDocument,
  position: vscode.Position,
  typedEnvArg: string
) {
  let envsReq: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "suggest/environmentVariables",
    params: {
      textDocument: {
        uri: document.uri.toString(),
      },
      position: position,
      searchQuery: typedEnvArg,
    },
  };
  const response: IJSONRPCResponse = await askLSP(envsReq);
  return response;
}
