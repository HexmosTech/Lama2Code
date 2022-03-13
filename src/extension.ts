import * as vscode from 'vscode';
import ExecuteCurrentFile from './executeCurrentFile';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('>>> Congratulations, your extension "elfling" is now active!');
	let e = new ExecuteCurrentFile(context)
	let disposable = vscode.commands.registerCommand('elfling.ExecuteCurrentFile', () => e.execFile());
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
