import { exec, execSync } from "child_process"
import * as semver from "semver"
import * as vscode from "vscode"
import { getShowLama2Term } from "./utils"

const LAMA2_TERM_NAME = "AutoLama2"
const UPDATE_MSG = "Support for environment variables."

export function getL2VersionAndUpdatePrompt(minVersionToCheck: string) {
  try {
    const l2Version = execSync("l2 --version", { encoding: "utf-8" }).trim()
    // Use the semver library to validate and normalize the version string
    const normalizedVersion = semver.valid(l2Version)
    if (normalizedVersion) {
      if (semver.lt(l2Version, minVersionToCheck)) {
        showUpdateWarning(minVersionToCheck)
      }
      return normalizedVersion
    } else {
      throw new Error("Invalid version format: " + l2Version)
    }
  } catch (e: any) {
    console.log("Problem while checking for version -> ", e)
    showDownloadBinaryError()
  }
}

function showUpdateWarning(minVersionToCheck: string) {
  const updateAction: vscode.MessageItem = { title: "Update" }
  const warningMessage = `Your version of Lama2 is outdated. Please update to version ${minVersionToCheck} or above for the best experience.\n\nUpdate: ${UPDATE_MSG}`

  vscode.window.showWarningMessage(warningMessage, updateAction).then((selectedAction) => {
    if (selectedAction === updateAction) {
      runL2UpdateCommand()
    }
  })
}

function showDownloadBinaryError() {
  const download: vscode.MessageItem = { title: "Download" }
  const errorMessage = `Your version of Lama2 is outdated. Some functionalities may not work correctly. Please download the latest version of Lama2 for the best experience.\n\nUpdate: ${UPDATE_MSG}`

  vscode.window.showErrorMessage(errorMessage, download).then((selectedAction) => {
    if (selectedAction === download) {
      // Go to the URL when "Download" is clicked
      vscode.env.openExternal(vscode.Uri.parse("https://github.com/HexmosTech/Lama2#installationupdate"))
    }
  })
}

function runL2UpdateCommand() {
  const terminal: any = getShowLama2Term(LAMA2_TERM_NAME)
  terminal.sendText("l2 -u")
  terminal.show()
}
