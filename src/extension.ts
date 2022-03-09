import * as vscode from 'vscode';
import executeCurrentFile from './executeCurrentFile';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('>>> Congratulations, your extension "elfling" is now active!');
	let disposable = vscode.commands.registerCommand('elfling.ExecuteCurrentFile', executeCurrentFile);
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
