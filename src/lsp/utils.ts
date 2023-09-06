import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ChildProcess } from "child_process";

// Create an output channel for Lama2 Language Server
const outputChannel = vscode.window.createOutputChannel(
  "Lama2 Language Server"
);

interface ILogOptions {
  msg: string;
  logType?: string;
  dataObject?: object;
  dataString?: string;
}

export interface ILogType {
  label: string;
  color: string;
}

// Log types and their corresponding attributes
const LOG_TYPES: Record<string, ILogType> = {
  error: { label: "Error", color: "red" },
  info: { label: "Info", color: "blue" },
  warning: { label: "Warning", color: "orange" },
};

export interface ILSPRequestDetails {
  process: ChildProcess;
  id: number;
  method: IJSONRPCMethod;
  params?: any;
}

export interface IJSONRPCResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: any;
}

export type IJSONRPCMethod =
  | "initialize"
  | "shutdown"
  | "exit"
  | "suggest/environmentVariables";

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

// Function to get the path for the server executable
export function getServerExecutablePath(): string {
  const executablePath = path.join("/home/lovestaco/repos/Lama2Code/", "l2");

  if (!fs.existsSync(executablePath)) {
    throw new Error(
      "The l2 server executable is not found in the specified path!"
    );
  }

  return executablePath;
}

// Helper function to log messages to the output channel
export function logToChannel(options: ILogOptions) {
  const { msg: message, logType = "info", dataObject, dataString } = options;

  const timestamp = new Date().toLocaleTimeString();
  const logTypeInfo = LOG_TYPES[logType.toLowerCase()] || LOG_TYPES["info"];

  const formattedMessage = `[${timestamp}] [${logTypeInfo.label}] ${message}`;
  outputChannel.appendLine(formattedMessage);

  if (dataObject !== undefined) {
    const dataAsString = JSON.stringify(dataObject, null, 2);
    outputChannel.appendLine(dataAsString);
  }

  if (dataString !== undefined) {
    outputChannel.appendLine(dataString);
  }
}
