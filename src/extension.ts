
export const MIN_VERSION_TO_CHECK = "1.2.3";
import * as vscode from 'vscode';
import * as path from 'path';
import { ServerOptions, LanguageClient, LanguageClientOptions } from 'vscode-languageclient/lib/node/main';
import { log } from 'console';

const LANGUAGE: string = "lama2";

console.log("LANGUAGE:", LANGUAGE); // log

export function activate(context: vscode.ExtensionContext) {
  const serverExecutablePath = getServerExecutablePath();
  log("serverExecutablePath -> ", serverExecutablePath);

  const serverOptions = getServerOptions(serverExecutablePath);
  log("serverOptions -> ", serverOptions);

  const clientOptions = getClientOptions();
  log("clientOptions -> ", clientOptions);

  const client = createLanguageClient(serverOptions, clientOptions);
  log("client -> ", client);

  startClient(client, context);
  log("client AFTER START -> ", client);
}

export function deactivate() {
  console.log("Extension deactivated"); // log
}

function getServerExecutablePath(): string {
  return path.join("/home/lovestaco/repos/Lama2Code/", './l2');
}

function getServerOptions(serverExecutablePath: string): ServerOptions {
  return {
    run: { command: serverExecutablePath, args: ['--lsp'] },
    debug: { command: serverExecutablePath, args: ['--lsp'] }
  };
}

function getClientOptions(): LanguageClientOptions {
  return {
    documentSelector: [{ scheme: 'file', language: LANGUAGE }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.l2')  // Assuming .l2 is the file extension for your language.
    }
  };
}

function createLanguageClient(serverOptions: ServerOptions, clientOptions: LanguageClientOptions): LanguageClient {
  return new LanguageClient(
    'languageServer',
    'Language Server',
    serverOptions,
    clientOptions
  );
}

function startClient(client: LanguageClient, context: vscode.ExtensionContext): void {
  client.start();
  context.subscriptions.push(client);
}
