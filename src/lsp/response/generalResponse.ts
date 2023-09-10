import * as vscode from "vscode";

export const ErrorCodes = {
  ERR_INVALID_AFTER_SHUTDOWN: -32000,
  ERR_UNSUPPORTED_FEATURE: -32001,
  ERR_INVALID_URI: -32002,
  ERR_UNEXPECTED_URI_SCHEME: -32003,
  ERR_INVALID_REQUEST: -32600,
  ERR_METHOD_NOT_FOUND: -32601,
};

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

export interface IJSONRPCResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: any;
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
