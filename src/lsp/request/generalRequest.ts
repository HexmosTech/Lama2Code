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

// Check if the process is initialized
function isProcessInitialized(process: any): boolean {
  return process.stdin && process.stdout;
}

// Create a JSON RPC request
function createJSONRPCRequest(
  requestDetails: ILSPRequestDetails
): IJSONRPCRequest {
  const { id, method, params = {} } = requestDetails;
  return {
    jsonrpc: "2.0",
    id,
    method,
    params,
  };
}

// Send a request to the process
function sendRequestToProcess(process: any, request: IJSONRPCRequest) {
  const requestString = JSON.stringify(request);
  process.stdin.write(requestString + "\n");
}

// Handle the response from the process
function handleProcessResponse(process: any, resolve: any, reject: any) {
  const chunks: any[] = [];
  process.stdout.on("data", (data: any) => {
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
}

// Main function to send requests to the Language Server Protocol and read responses
export function askLSP(
  requestDetails: ILSPRequestDetails
): Promise<IJSONRPCResponse> {
  return new Promise((resolve, reject) => {
    const { process } = requestDetails;

    if (!isProcessInitialized(process)) {
      logToChannel({ msg: "Server not initialized to make a request" });
      reject(new Error("Server not initialized to make a request"));
      return;
    }

    const request = createJSONRPCRequest(requestDetails);
    logToChannel({ msg: "Sending request: ", dataObject: request });
    sendRequestToProcess(process, request);
    handleProcessResponse(process, resolve, reject);
  });
}
