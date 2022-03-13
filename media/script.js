$(document).ready(function () {
    const vscode = acquireVsCodeApi();
    var respBody = $('#responsebody').text()
    console.log("respBody = ", respBody)
    try {
        let j = JSON.parse(respBody)
        var j2ht = new J2HConverter(respBody, "responsebody");
        j2ht.convert();
        vscode.postMessage({
            command: 'alert',
            text: 'j is json ;' + respBody.slice(0, 100)
        })
        var tree = jsonTree.create(j, $('#responsebody'));
    } catch (e) {
        console.log("j is not json")
        vscode.postMessage({
            command: 'alert',
            text: 'j is not json ' + respBody.slice(0, 100)
        })
    }
});
