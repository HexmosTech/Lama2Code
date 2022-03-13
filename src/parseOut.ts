let fs = require('fs')

function splitAt(value: string, index: any) {
    return [value.substring(0, index), value.substring(index)]
}

export default function splitElfOutput(content: string) {
    var re = /^HTTP/gm;
    var match = re.exec(content);
    var elflog = "", httpie = "", httpHead = "", body = "";
    if (match) {
        [elflog, httpie] = splitAt(content, match.index);
    }
    re = /^\s*[{<]/gm;
    match = re.exec(httpie);
    if (match) {
        [httpHead, body] = splitAt(httpie, match.index);
    }
    return [elflog.trim(), httpHead.trim(), body.trim()];
}

// let content = fs.readFileSync("/tmp/blah.out").toString();