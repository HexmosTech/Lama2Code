let fs = require('fs')

function splitAt(value: string, index: any) {
    return [value.substring(0, index), value.substring(index)]
}

export default function lama2Output(content: string) {
    var re = /^HTTP/gm;
    var match = re.exec(content);
    var lama2Log = "", httpie = "", httpHead = "", body = "";
    if (match) {
        [lama2Log, httpie] = splitAt(content, match.index);
    }
    re = /^\s*[{\[<]/gm;
    match = re.exec(httpie);
    if (match) {
        [httpHead, body] = splitAt(httpie, match.index);
    }
    return [lama2Log.trim(), httpHead.trim(), body.trim()];
}

// let content = fs.readFileSync("/tmp/blah.out").toString();