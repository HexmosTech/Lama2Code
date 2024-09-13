import { simpleGit, SimpleGit, CleanOptions } from "simple-git"
import * as vscode from "vscode"
import * as path from "path"

class GetRemoteURL {
  context: vscode.ExtensionContext

  constructor(ctx: vscode.ExtensionContext) {
    this.context = ctx
  }

  async findURL() {
    try {
      let currentFilePath: string = vscode.window.activeTextEditor!.document.fileName
      let parentDir: string = path.dirname(currentFilePath)
      let localgit: SimpleGit = simpleGit(parentDir).clean(CleanOptions.FORCE)

      const gitRemotes = await localgit.getRemotes(true)
      const branchSummary = await localgit.branch()
      const currentBranch = branchSummary.current
      const remoteURL = gitRemotes[0]["refs"]["push"]

      const rootDir = await localgit.revparse(["--show-toplevel"])
      const relativePath = path.relative(rootDir, currentFilePath) // find relative path b/w root and current working directory

      let gitRepoURL = remoteURL
      let gitURLPrefix
      if (!remoteURL.startsWith("git@") && !remoteURL.startsWith("https")) {
        vscode.window.showErrorMessage("URL not found. Currently supports Github only (both HTTPS and SSH)")
      } else {
        if (remoteURL.startsWith("git@")) {
          gitRepoURL = remoteURL.split("@")[1] // split with @ and get the repo url
          gitURLPrefix = "https://"
        } else if (remoteURL.startsWith("https")) {
          const stripdotgit = remoteURL.substring(0, remoteURL.length - 4) + "/blob/" // remove .git
          gitURLPrefix = ""
        }
        const stripdotgit = gitRepoURL.substring(0, gitRepoURL.length - 4) + "/blob/" // remove .git
        const replacecolon = stripdotgit.replace(":", "/") // replace colon with forward slash
        const result = gitURLPrefix + replacecolon + currentBranch + "/" + relativePath
        vscode.window.showInformationMessage("Remote URL successfully found and copied to clipboard")
        vscode.env.clipboard.writeText(result.toString())
      }
      return "SUCCESS"
    } catch (error: any) {
      /* handle all errors here */
      const errorMessage = error.message
      // console.log('ERROR:', errMessage);
      vscode.window.showErrorMessage("URL not found because " + errorMessage)

      return "FAILED"
    }
  }
}

export function getRemoteUrl(context: vscode.ExtensionContext) {
  let getremoteUrl = new GetRemoteURL(context)
  console.log(getremoteUrl)
  let getremoteUrlFileDisposable = vscode.commands.registerCommand("lama2.GetRemoteURL", () => getremoteUrl.findURL())
  return getremoteUrlFileDisposable
}
