import * as vscode from "vscode"
import LanguagesData from "./languages"
import { codeGeneration } from "../../lsp/request/generalRequest"
import { IJSONRPCResponse } from "../../lsp/response/generalResponse"

interface LanguageData {
  info: {
    key: string
    title: string
    extname: string
    default: string
  }
  clientsById: Record<string, null>
}

interface LanguagesData {
  [key: string]: LanguageData
}

class GenerateCodeSnippet {
  async execFile(langServer: any, lang: string, cli: string) {
    let currentFilePath = vscode.window.activeTextEditor?.document.fileName
    if (!currentFilePath) {
      vscode.window.showErrorMessage("No file is currently open.")
      return
    }
    const response: IJSONRPCResponse = await codeGeneration(langServer, 2, currentFilePath, lang, cli)
    let { result } = response
    if (result === "false" || result === false || result.includes("Error")) {
      vscode.window.showInformationMessage("Something went wrong. Retry.")
    } else {
      if (result.includes("Code copied to clipboard")) {
        result = result.replace("Code copied to clipboard", "")
      }
      vscode.env.clipboard.writeText(result.toString())
      vscode.window.showInformationMessage("Copied code snippet to clipboard.")
    }
  }
}

function isDefault(defaultClient: string, client: string) {
  if (defaultClient == client) {
    return "(Default)"
  } else {
    return ""
  }
}

export function genCodeSnip(langServer: any) {
  let generateCodeSnippet = new GenerateCodeSnippet()
  let generateCodeSnippetDisposable = vscode.commands.registerCommand("lama2.GenerateCodeSnippet", async () => {
    const langkwys = Object.keys(LanguagesData)
    let languageOptions: { [key: string]: string } = {}
    for (let i = 0; i < langkwys.length; i++) {
      const key = langkwys[i] as keyof typeof LanguagesData
      const languageData = LanguagesData[key]
      languageOptions[languageData.info.title] = languageData.info.key
    }

    const languageKeys = Object.keys(LanguagesData)

    // Level2 command pallette
    let language: string | undefined = await vscode.window.showQuickPick(Object.keys(languageOptions))

    if (language) {
      language = languageOptions[language]
      const languageKey = languageKeys.find(
        (key) => LanguagesData[key as keyof typeof LanguagesData].info.key === language
      )!

      const clientsById = LanguagesData[languageKey as keyof typeof LanguagesData].clientsById
      const defaultClient = LanguagesData[languageKey as keyof typeof LanguagesData].info.default

      const clientKeys = Object.keys(clientsById)

      if (clientKeys.length === 1) {
        const client = clientKeys[0]
        generateCodeSnippet.execFile(langServer, language, client)
      } else {
        // Level3 command pallette
        const selection:
          | {
              label: string
              language: string
              client: string
            }
          | undefined = await vscode.window.showQuickPick(
          clientKeys
            .sort((a, b) => (a === defaultClient ? -1 : b === defaultClient ? 1 : 0))
            .map((client) => ({
              label: `${language ?? ""}: ${client} ${isDefault(defaultClient, client)}`,
              language: language ?? "",
              client: client,
            })),
          { placeHolder: "Select a client" }
        )

        if (selection) {
          generateCodeSnippet.execFile(langServer, selection.language, selection.client)
        }
      }
    }
  })
  return generateCodeSnippetDisposable
}
