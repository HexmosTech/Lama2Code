let fs = require("fs")

function splitAt(value: string, index: any) {
  return [value.substring(0, index), value.substring(index)]
}

export default function lama2Output(content: string) {
  console.log("Try to parse the stuff")
  let res = null
  try {
    res = JSON.parse(content)
  } catch (e) {
    console.log("Trying to parse JSON")
    console.log("error = ", e)
  }
  return [res["logs"].trim(), res["headers"].trim(), res["body"].trim()]
}

export function splitLama2Output(content: any): [string] {
  console.log("content = ", content)
  try {
    if (content) {
      const httpHead = content?.headers || ""

      return [httpHead]
    }
  } catch (error) {
    console.error("Error parsing Lama2 output:", error)
  }

  return [""]
}
