let fs = require("fs");

function splitAt(value: string, index: any) {
  return [value.substring(0, index), value.substring(index)];
}

export default function lama2Output(content: string) {
  console.log("Try to parse the stuff");
  let res = null;
  try {
    res = JSON.parse(content);
  } catch (e) {
    console.log("Trying to parse JSON");
    console.log("error = ", e);
  }
  return [res["logs"].trim(), res["headers"].trim(), res["body"].trim()];
}

export function splitLama2Output(content: string): [string, string, string] {
    const parts = content.split('\n\n');
    let lama2Log = '';
    let httpHead = '';
    let body = '';

    if (parts.length >= 3) {
        lama2Log = parts[0];
        httpHead = parts[1];
        body = parts.slice(2).join('\n\n');
    } else if (parts.length === 2) {
        lama2Log = parts[0];
        body = parts[1];
    } else if (parts.length === 1) {
        body = parts[0];
    }

    return [lama2Log, httpHead, body];
}