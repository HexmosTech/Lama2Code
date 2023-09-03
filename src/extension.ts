
export const MIN_VERSION_TO_CHECK = "1.2.3";
import * as vscode from 'vscode';
import * as path from 'path';
import { ServerOptions, LanguageClient, LanguageClientOptions, TransportKind } from 'vscode-languageclient/lib/node/main';
import * as child_process from 'child_process';
import { log } from 'console';

const LANGUAGE: string = "lama2";

console.log("LANGUAGE:", LANGUAGE); // log
const serverProcess = child_process.spawn(getServerExecutablePath(), ['--lsp']);
const outputChannel = vscode.window.createOutputChannel("Lama2 Language Server");

export function activate(context: vscode.ExtensionContext) {
  const serverExecutablePath = getServerExecutablePath();
  outputToChannel(`Server Executable Path: ${serverExecutablePath}`);

  // Start the LSP server
  // Handle messages from the server (responses and notifications)
  serverProcess.stdout.on('data', (data) => {
    console.log(`Received from server: ${data}`);
    outputToChannel(`Received from server: ${data}`);
    // You can further process or handle the data here.
  });

  log("client AFTER START -> ", serverProcess);
}

export function deactivate() {
  outputToChannel("Extension deactivated");
  console.log("Extension deactivated"); // log
  sendRequestToServer({ "jsonrpc": "2.0", "id": 2, "method": "shutdown" });
  sendRequestToServer({ "jsonrpc": "2.0", "method": "exit" });
}

function getServerExecutablePath(): string {
  return path.join("/home/lovestaco/repos/Lama2Code/", './l2');
}

// Helper function to write to the output channel
function outputToChannel(message: string) {
  outputChannel.appendLine(message);
}


// Sending a request to the server
function sendRequestToServer(request: object) {
  const requestString = JSON.stringify(request);
  outputToChannel(`Sending to server: ${requestString}`);
  serverProcess.stdin.write(requestString + "\n");  // Note: Make sure each request ends with a newline character.
}

// For example, to initialize the server:
sendRequestToServer({
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    // Your initialization parameters here...
  }
});