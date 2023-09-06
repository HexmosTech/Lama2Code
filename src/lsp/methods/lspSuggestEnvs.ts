import * as vscode from "vscode";
import { ChildProcess } from "child_process";
import { IJSONRPCResponse, ILSPRequestDetails, sendRequestToLSPReadResponse } from "../utils";

export async function getEnvsFromLsp(langServer: ChildProcess, requestId: number, document: vscode.TextDocument, position: vscode.Position, typedEnvArg: string) {
  let envsReq: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: 'suggest/environmentVariables',
    params: {
      textDocument: {
        uri: document.uri.toString()
      },
      position: position,
      relevantSearchString: typedEnvArg
    }
  };
  const response: IJSONRPCResponse = await sendRequestToLSPReadResponse(envsReq);
  return response;
}