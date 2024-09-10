// import * as vscode from 'vscode';
// import { getNonce } from '../utilities/getNonce';

// let panel: vscode.WebviewPanel | undefined = undefined;


// function createWebviewHTML(URI: vscode.Uri, initialData: any) : string {
//     return (
//         `
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>React Labyrinth</title>
//             </head>
//             <body>
//                 <div id="root"></div>
//                 <script>
//                     const vscode = acquireVsCodeApi();
//                     window.onload = () => {
//                         vscode.postMessage({
//                             type: 'onData',
//                             value: ${JSON.stringify(initialData)}
//                         });
//                     }
//                 </script>
//                 <script nonce=${getNonce()} src=${URI}></script>
//             </body>
//             </html>
//         `
//     );
// }

// export function createPanel(context: vscode.ExtensionContext, data: any, columnToShowIn: vscode.ViewColumn) {
//     // Utilize method on vscode.window object to create webview
//     panel = vscode.window.createWebviewPanel(
//         'reactLabyrinth',
//         'React Labyrinth',
//         // Create one tab
//         vscode.ViewColumn.One,
//         {
//             enableScripts: true,
//             retainContextWhenHidden: true
//         }
//     );
    
//     // Set the icon logo of extension webview
//     panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'RL(Final).png');
    
//     // Set URI to be the path to bundle
//     const bundlePath: vscode.Uri = vscode.Uri.joinPath(context.extensionUri, 'build', 'bundle.js');

//     // Set webview URI to pass into html script
//     const bundleURI: vscode.Uri = panel.webview.asWebviewUri(bundlePath);

//     // Render html of webview here
//     panel.webview.html = createWebviewHTML(bundleURI, data);

//     // ...

//     return panel;
// };

