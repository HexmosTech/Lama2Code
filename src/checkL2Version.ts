import { exec } from "child_process";
import * as vscode from "vscode";
import { getShowLama2Term } from "./utils";

const VERSION_TO_CHECK = "1.5.1";
const LAMA2_TERM_NAME = "AutoLama2";

export function checkL2Version() {
  try {
    getL2Version((l2Version) => {
      // Check if version is below VERSION_TO_CHECK
      if (compareL2Versions(l2Version, VERSION_TO_CHECK) < 0) {
        showUpdateWarning();
      }
    });
  } catch (e: any) {
    console.log("Problem while checking for version -> ", e);
  }
}

function getL2Version(callback: (version: string) => void) {
  exec("l2 --version", (error, stdout, stderr) => {
    const versionOutput = stdout.trim();
    const versionMatch = versionOutput.match(/v(\d+\.\d+\.\d+)/);
    if (versionMatch && versionMatch.length === 2) {
      const l2Version = versionMatch[1];
      callback(l2Version);
    }
  });
}

function compareL2Versions(currentVersion: string, latestVersion: string) {
  const curVersionParts = currentVersion.split(".");
  const lstVersionParts = latestVersion.split(".");
  for (let i = 0; i < 3; i++) {
    const curNum = Number(curVersionParts[i]);
    const lstNum = Number(lstVersionParts[i]);
    if (curNum > lstNum) return 1;
    if (lstNum > curNum) return -1;
    if (!isNaN(curNum) && isNaN(lstNum)) return 1;
    if (isNaN(curNum) && !isNaN(lstNum)) return -1;
  }
  return 0;
}

function showUpdateWarning() {
  const updateAction: vscode.MessageItem = { title: "Update" };
  vscode.window
    .showWarningMessage(
      `Your Lama2 version is outdated. Please update to version ${VERSION_TO_CHECK} or above for the best experience.`,
      updateAction
    )
    .then((selectedAction) => {
      if (selectedAction === updateAction) {
        runL2UpdateCommand();
      }
    });
}

function runL2UpdateCommand() {
  const terminal: any = getShowLama2Term(LAMA2_TERM_NAME);
  terminal.sendText("l2 -u");
  terminal.show();
}
