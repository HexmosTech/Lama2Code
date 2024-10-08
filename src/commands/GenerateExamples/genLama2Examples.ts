import * as vscode from "vscode"
let examplesJSONStr =
  '{"0006_cookies.l2":"POST \\nhttps://httpbin.org/post\\n\\n# HEADERS\\nCookie:\\"sessionid=foo;another-cookie=bar\\"\\n\\nHeader1:value1\\nHeader2: Value2\\n\\n# DATA\\nhello=world","0002_sample_post.l2":"POST\\nhttps://httpbin.org/post\\n\\n{\\n  \\"a\\": \\"b\\",\\n  \\"c\\": \\"d\\"\\n}","0005_headers_simple.l2":"POST \\nhttps://httpbin.org/post\\n\\n# HEADERS\\nX-Parse-Application-Id:\'helloworld\'\\nX-Parse-REST-API-Key:\\"byeworld\\"\\n\\n# DATA\\na=\\"b\\"  # double-quoted string\\n\'c\'=d  # single-quoted & unquoted strings","0008_base64_image":{"0008_base64_image.l2":"POST\\nhttp://httpbin.org/post\\n\\n{\\n\\t\\"imageb64_field\\": \\"\'${PHOTO}\'\\",\\n}","l2.env":"\\nexport PHOTO=`base64 image.jpeg`"},"0001_sample_post_varjson.l2":"POST\\nhttps://httpbin.org/post\\n\\na=b\\nc=d","0007_multipart_file":{"0007_multipart_file.l2":"POST\\nMULTIPART\\nhttp://httpbin.org/post\\n\\n\'X-Parse-Application-Id\':helloworld \\nX-Parse-REST-API-Key:\\"helloworld\\"\\n\\n# DATA\\nfirst=second\\n\\n# FILES\\nmyfile@./image.jpeg"},"0004_env_switch_root":{"0004_env_switch_root.l2":"POST\\n${REMOTE}/post\\n\\n{\\n    \\"lorem\\": \\"ipsum\\"\\n}","l2.env":"export LOCAL=\\"http://localhost:8000\\"\\nexport REMOTE=\\"http://httpbin.org\\""},"0003_comment.l2":"# Pound symbol signifies a comment\\nPOST\\nhttps://httpbin.org/post\\n\\na=b # Comments may start at the end of lines as well\\nc=d\\n\\n# Comments work even after the payload","0000_sample_get.l2":"GET\\nhttps://httpbin.org/get","0009_processor_basic":{"0009_processor_basic.l2":"url = \\"http://google.com\\"\\n---\\n# stage 1\\n\\nPOST\\n${REMOTE_COORD}/anything\\n\\n{\\n    \\"username\\": \\"admin\\",\\n    \\"password\\": \\"Password@123\\",\\n    \\"from\\": \\"${LOCAL_COORD}/anything\\",\\n    \\"url\\": \\"${url}\\",\\n    \\"Token\\": \\"MySuperSecretToken\\"\\n}\\n\\n---\\n\\n// filtering, store in var\\nconsole.log(\\"@@Result\\", result)\\nlet TOKEN = result[\\"json\\"][\\"Token\\"]\\nconsole.log(TOKEN)\\n\\n---\\n\\n# stage 2\\nGET\\n${REMOTE_COORD}/bearer\\n\\nAuthorization: \'Bearer ${TOKEN}\'\\n\\n{}","l2.env":"\\nexport LOCAL_COORD=\\"http://localhost:8080\\"\\nexport REMOTE_COORD=\\"http://httpbin.org\\""}}'
let examplesJSON = JSON.parse(examplesJSONStr)
let specificExGlobal = ""
let subSpecificExGlobal = ""

export function genLama2Examples() {
  return vscode.commands.registerCommand("lama2.Lama2Examples", async () => {
    let specificEx: string | undefined = await vscode.window.showQuickPick(Object.keys(examplesJSON))

    if (specificEx) {
      specificExGlobal = specificEx
      if (specificEx.endsWith(".env") || specificEx.endsWith(".l2")) {
        vscode.window.activeTextEditor?.edit((builder) => {
          const doc = vscode.window.activeTextEditor?.document
          builder.replace(
            new vscode.Range(doc!.lineAt(0).range.start, doc!.lineAt(doc!.lineCount - 1).range.end),
            examplesJSON[specificExGlobal]
          )
        })
        return
      }

      let subSpecificEx: string | undefined = await vscode.window.showQuickPick(Object.keys(examplesJSON[specificEx]))

      if (subSpecificEx) {
        subSpecificExGlobal = subSpecificEx
        vscode.window.activeTextEditor?.edit((builder) => {
          const doc = vscode.window.activeTextEditor?.document
          builder.replace(
            new vscode.Range(doc!.lineAt(0).range.start, doc!.lineAt(doc!.lineCount - 1).range.end),
            examplesJSON[specificExGlobal][subSpecificExGlobal]
          )
        })
        return
      }
    }
  })
}
