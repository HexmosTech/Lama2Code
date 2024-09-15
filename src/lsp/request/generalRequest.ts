import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import { ChildProcess } from "child_process"
import { IJSONRPCResponse, logToChannel } from "../response/generalResponse"

export type IJSONRPCMethod =
  | "initialize"
  | "shutdown"
  | "exit"
  | "suggest/environmentVariables"
  | "executeCommand"
  | "codeGeneration"

export interface ILSPRequestDetails {
  process: ChildProcess
  id: number
  method: IJSONRPCMethod
  params?: any
}

export interface IJSONRPCRequest {
  jsonrpc: "2.0"
  id: number
  method: IJSONRPCMethod
  params: any
}

// Check if the process is initialized
function isProcessInitialized(process: any): boolean {
  return process.stdin && process.stdout
}

// Create a JSON RPC request
function createJSONRPCRequest(requestDetails: ILSPRequestDetails): IJSONRPCRequest {
  const { id, method, params = {} } = requestDetails
  return {
    jsonrpc: "2.0",
    id,
    method,
    params,
  }
}

// Send a request to the process
function sendRequestToProcess(process: any, request: IJSONRPCRequest) {
  const requestString = JSON.stringify(request)
  process.stdin.write(requestString + "\n")
}

// Handle the response from the process
function handleProcessResponse(process: any, resolve: any, reject: any) {
  const chunks: any[] = []
  let count = 0
  process.stdout.on("data", (data: any) => {
    count++
    console.log("count", count)
    chunks.push(data)
    const responseData = Buffer.concat(chunks).toString()
    try {
      const secondJsonStart = responseData.lastIndexOf('{"id":2')
      const secondJsonString = responseData.substring(secondJsonStart)
      const responseObject = JSON.parse(secondJsonString) as IJSONRPCResponse
      console.log("responseObject", responseObject)
      if (responseObject.jsonrpc && responseObject.id) {
        resolve(responseObject)
        return
      }
    } catch (error: any) {
      console.log("error in catch", error)
      return
    }
  })

  process.stdout.on("end", () => {
    console.log("chunks", Buffer.concat(chunks).toString())
    logToChannel({
      msg: "Received incomplete response from server",
      dataString: Buffer.concat(chunks).toString(),
    })
    reject(new Error("Received incomplete response from server"))
    return
  })

  process.stdout.on("error", (error: any) => {
    console.log("error", error)
    reject(new Error("Error reading from server: " + error.message))
    return
  })
}

// Main function to send requests to the Language Server Protocol and read responses
export function askLSP(requestDetails: ILSPRequestDetails): Promise<IJSONRPCResponse> {
  return new Promise((resolve, reject) => {
    const { process } = requestDetails

    if (!isProcessInitialized(process)) {
      logToChannel({ msg: "Server not initialized to make a request" })
      reject(new Error("Server not initialized to make a request"))
      return
    }

    const request = createJSONRPCRequest(requestDetails)
    logToChannel({ msg: "Sending request: ", dataObject: request })
    sendRequestToProcess(process, request)
    let response = handleProcessResponse(process, resolve, reject)
    console.log("response", response)
    // logToChannel({ msg: "Received response: ", dataObject: response });
    return response
  })
}

export async function executeL2Command(
  langServer: ChildProcess,
  requestId: number,
  command: string
): Promise<IJSONRPCResponse> {
  let l2Req: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "executeCommand",
    params: {
      filePath: command,
    },
  }
  return await askLSP(l2Req)
}

export async function codeGeneration(
  langServer: ChildProcess,
  requestId: number,
  filePath: string,
  language: string,
  client: string
): Promise<IJSONRPCResponse> {
  let l2Req: ILSPRequestDetails = {
    process: langServer,
    id: requestId,
    method: "codeGeneration",
    params: {
      filePath: filePath,
      language: language,
      client: client,
    },
  }
  return await askLSP(l2Req)
}
