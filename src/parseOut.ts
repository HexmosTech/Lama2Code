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
  return [res["logs"].trim(), res["headers"].trim(), res["body"].trim(),res["performance"],res["statusCodes"],res["contentSizes"]];
}
