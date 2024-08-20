import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";

import Header from "@/modules/Headers";
import IconPanel from "@/modules/IconPanel";
import JsonView from "@/modules/JsonView";
import HtmlView from "@/modules/HtmlView";
import Metadata from "@/modules/Metadata";
import Error from "@/modules/Error";
import { Button } from "primereact/button"

interface HeaderItem {
  header: string
  value: string
}

interface ApiMetrics {
  status: string
  time: string
  size: string
}

declare global {
  interface Window {
    acquireVsCodeApi: () => any
  }
}

const vscode = window.acquireVsCodeApi()

const Response: React.FC = () => {
  const [highlightedIcon, setHighlightedIcon] = useState<string>("code")
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [body, setBody] = useState<object>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics>({
    status: "",
    time: "",
    size: "",
  })
  const [headers, setHeaders] = useState<HeaderItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showTerminal, setShowTerminal] = useState<boolean>(false)

  const toggleIcon = (icon: string) => {
    setHighlightedIcon(icon)
  }

  const convertHeadersToTableData = (headersString: string): HeaderItem[] => {
    const headers = headersString.split("\n")
    return headers
      .filter((header: string) => header.trim() !== "")
      .map((header) => {
        const [key, ...valueParts] = header.split(":")
        return {
          header: key.toLowerCase().trim(),
          value: valueParts.join(":").trim(),
        }
      })
  }

  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      const message = event.data
      if (message.command === "update") {
        // console.log("message", message);

        if (message.status === "starting") {
          setIsLoading(true)
          setError(null)
          return
        }

        if (message.status === "error") {
          setIsLoading(false)
          setError(message.error)
          return
        }

        try {
          let bodyContent
          let isHtmlContent = false
          let parsedBody

          // Parse the message body if it's a string
          if (typeof message.body === "string") {
            parsedBody = JSON.parse(message.body)
          } else {
            parsedBody = message.body
          }

          // Check for HTML content
          if (parsedBody.body && typeof parsedBody.body === "string" && parsedBody.body.trim().startsWith("<")) {
            bodyContent = parsedBody.body
            isHtmlContent = true
          } else if (parsedBody.body) {
            bodyContent = parsedBody.body
            isHtmlContent = false
          } else {
            // If there's no body property, assume the entire parsedBody is the content
            bodyContent = parsedBody
            isHtmlContent = typeof bodyContent === "string" && bodyContent.trim().startsWith("<")
          }

          if (isHtmlContent) {
            setHtmlContent(bodyContent)
            setBody({})
          } else {
            setHtmlContent(null)
            setBody(typeof bodyContent === "string" ? JSON.parse(bodyContent) : bodyContent)
          }

          // Extract metadata
          console.log("parsedBody", parsedBody)
          const statusCode = parsedBody?.statusCodes?.at(-1)?.statusCode || ""
          const performance = parsedBody?.performance?.responseTimes?.at(-1)?.timeInMs || ""
          const size = parsedBody?.contentSizes?.at(-1)?.sizeInBytes || ""
          setApiMetrics({ status: statusCode, time: performance, size: size })

          // Set headers
          setHeaders(convertHeadersToTableData(parsedBody.headers || ""))
          setError(null)
        } catch (error) {
          console.log("error", error)
          setError("Failed to parse response data")
        } finally {
          setIsLoading(false)
        }
      }
    }

    window.addEventListener("message", messageListener)

    return () => window.removeEventListener("message", messageListener)
  }, [])

  if (isLoading) {
    return (
      <div className="spinner-container">
        <ProgressSpinner />
      </div>
    )
  }

  const toggleTerminal = () => {
    vscode.postMessage({ command: "toggleTerminal" })
    setShowTerminal(!showTerminal)
  }

  if (error) {
    return (
      <div className="error-container">
        <Error error={error} />
        <Button label={showTerminal ? "Hide Terminal" : "Show Terminal"} onClick={toggleTerminal} />
      </div>
    )
  }

  const responseContent = (
    <>
      <div className="meta-icon-section">
        <Metadata {...apiMetrics} />
        <IconPanel
          highlightedIcon={highlightedIcon}
          toggleIcon={toggleIcon}
          isHtmlContent={!!htmlContent}
          showTerminal={toggleTerminal}
        />
      </div>

      <div>{htmlContent ? <HtmlView content={htmlContent} /> : <JsonView data={body} />}</div>
    </>
  )

  const headersContent = (
    <div className="card">
      <DataTable value={headers} tableStyle={{ minWidth: "50rem" }}>
        <Column field="header" header="Header"></Column>
        <Column field="value" header="Value"></Column>
      </DataTable>
    </div>
  )

  return <Header responseContent={responseContent} headersContent={headersContent} />
}

export default Response;
