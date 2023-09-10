import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ChildProcess } from "child_process";
import { IJSONRPCResponse, logToChannel } from "../response/generalResponse";

export type IJSONRPCMethod =
  | "initialize"
  | "shutdown"
  | "exit"
  | "suggest/environmentVariables";

export interface ILSPRequestDetails {
  process: ChildProcess;
  id: number;
  method: IJSONRPCMethod;
  params?: any;
}

export interface IJSONRPCRequest {
  jsonrpc: "2.0";
  id: number;
  method: IJSONRPCMethod;
  params: any;
}

// Function to send requests to the Language Server Protocol and read responses
export function sendRequestToLSPReadResponse(
  requestDetails: ILSPRequestDetails
): Promise<IJSONRPCResponse> {
  return new Promise((resolve, reject) => {
    let { process, id, method, params } = requestDetails;

    if (!process.stdin || !process.stdout) {
      logToChannel({ msg: "Server not initialized to make a request" });
      reject(new Error("Server not initialized to make a request"));
      return;
    }

    params = params ? params : {};

    const request: IJSONRPCRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    logToChannel({ msg: "Sending request: ", dataObject: request });
    const requestString = JSON.stringify(request);
    process.stdin.write(requestString + "\n");

    const chunks: any[] = [];
    process.stdout.on("data", (data) => {
      chunks.push(data);
      const responseData = Buffer.concat(chunks).toString();
      try {
        const responseObject = JSON.parse(responseData);
        if (responseObject.jsonrpc && responseObject.id) {
          resolve(responseObject);
        }
      } catch (error: any) {
        // If JSON parsing fails, wait for a complete response
      }
    });

    process.stdout.on("end", () => {
      logToChannel({
        msg: "Received incomplete response from server",
        dataString: Buffer.concat(chunks).toString(),
      });
      reject(new Error("Received incomplete response from server"));
    });
  });
}
