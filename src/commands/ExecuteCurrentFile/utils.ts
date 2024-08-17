import * as vscode from "vscode";

// Define a custom interface for the terminal object (optional, based on your specific use case)
interface CustomTerminal extends vscode.Terminal {
  name: string;
}

function getActiveTerminals(): CustomTerminal[] {
  // Convert the readonly array to a mutable array by creating a copy
  return vscode.window.terminals.slice();
}

function findTerminalsByName(name: string): CustomTerminal | undefined {
  let terminals = getActiveTerminals();
  let found = terminals.find((element) => element.name === name);
  return found;
}

function findOrCreateTerminal(name: string): CustomTerminal {
  let terminal = findTerminalsByName(name);
  if (!terminal) {
    terminal = vscode.window.createTerminal(name);
  }
  return terminal;
}

export function getShowLama2Term(name: string): CustomTerminal {
  let terminal = findOrCreateTerminal(name);
  // Clear terminal and send Ctrl+C before showing
  terminal.sendText("\x03");
  // terminal.show();
  return terminal;
}


import * as fs from 'fs';

export function generateRandomName(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function getLama2Command() {
  try {
    console.log('getLama2Command');
    let randomNameFile: string | null = null;
    let randomNameFlag: string | null = null;
    let cmd: string | null = null;
    const windowsBasePath = 'C:\\ProgramData\\.lama2';
    const randomNameBase = generateRandomName(8);
    const currentFilePath = vscode.window.activeTextEditor?.document.fileName;

    if (process.platform === 'win32') {
        if (!fs.existsSync(windowsBasePath)) {
            fs.mkdirSync(windowsBasePath);
        }
        randomNameFlag = `${windowsBasePath}\\${randomNameBase}.flag`;
        randomNameFile = `${windowsBasePath}\\${randomNameBase}.json`;
        cmd = `powershell l2 -o ${randomNameFile} ${currentFilePath}; New-Item -Path ${randomNameFlag}`;
    } else {
        randomNameFlag = `/tmp/${randomNameBase}.flag`;
        randomNameFile = `/tmp/${randomNameBase}.json`;
        cmd = `l2 -o ${randomNameFile} ${currentFilePath}; touch ${randomNameFlag}`;
    }

    return {
        cmd: cmd,
        rflag: randomNameFlag,
        rfile: randomNameFile,
    };
  }
  catch (error) {
    console.error('Failed to generate Lama2 command', error);
    throw new Error('Failed to generate Lama2 command');
  }
    
}