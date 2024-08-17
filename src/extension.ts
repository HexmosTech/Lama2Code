import * as vscode from 'vscode';
import { Lama2Panel } from './panels/RequestPanel';
import { getRemoteUrl } from './commands/RemoteUrl/getRemoteUrl';
import { prettifyL2File } from './commands/PrettifyFile/prettifyL2File';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('lama2.ExecuteCurrentFile', async () => {
            
          Lama2Panel.render(context.extensionUri);
          if (Lama2Panel.currentPanel) {
                await Lama2Panel.currentPanel.executeLama2Command();
            }
        })
    );
    let getremoteUrlFileDisposable = getRemoteUrl(context);
    context.subscriptions.push(getremoteUrlFileDisposable);
    console.log(">>> getremoteUrlFileDisposable is now active!");


    let prettifyCurrentFileDisposable = prettifyL2File();
    context.subscriptions.push(prettifyCurrentFileDisposable);
    console.log(">>> prettifyCurrentFileDisposable is now active!");
}

export function deactivate() {
    
}