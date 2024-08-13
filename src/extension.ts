import * as vscode from 'vscode';
import { Lama2Panel } from './panels/RequestPanel';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('lama2.ExecuteCurrentFile', async () => {
            
          Lama2Panel.render(context.extensionUri);
          if (Lama2Panel.currentPanel) {
                await Lama2Panel.currentPanel.executeLama2Command();
            }
        })
    );
}

export function deactivate() {}