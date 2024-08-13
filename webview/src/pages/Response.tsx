import { useState, useEffect } from "preact/hooks";
import { TabView, TabPanel } from "primereact/tabview";
import { classNames } from "primereact/utils";
import ReactJson from "react-json-view";

import { ProgressSpinner } from "primereact/progressspinner";

import { Button } from "primereact/button";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
// @ts-ignore
import JsonIcon from "@/assets/json.jsx";
// @ts-ignore
import GridIcon from "@/assets/grid.jsx";
// @ts-ignore
import CopyIcon from "@/assets/copy.jsx";
// @ts-ignore
import LogsIcon from "@/assets/logs.jsx";
import { time } from "console";
// dark theme
// import "primereact/resources/themes/saga-blue/theme.css";

// import "primereact/resources/themes/viva-dark/theme.css"
// import "primereact/resources/themes/lara-dark-teal/theme.css";

const Response = () => {
  interface HeaderItem {
    header: string;
    value: string;
  }

  const [highlightedIcon, setHighlightedIcon] = useState("code");
  const [body, setBody] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiMetrics, setApiMetrics] = useState({
    status: "",
    time: "",
    size: "",
  });
  const toggleIcon = (icon: string) => {
    setHighlightedIcon(icon);
  };
  const [headers, setHeaders] = useState<HeaderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  function convertHeadersToTableData(headersString: string): HeaderItem[] {
    const headers = headersString.split("\n");
    return headers
      .filter((header: string) => header.trim() !== "")
      .map((header) => {
        const [key, ...valueParts] = header.split(":");
        return {
          header: key.toLowerCase().trim(),
          value: valueParts.join(":").trim(),
        };
      });
  }

  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "update") {
        console.log("message", message);

        const data = JSON.parse(message.body);

        if (data.status === "starting") {
          setIsLoading(true);
          setError(null); // Clear any previous errors
          return;
        }

        if (data.status === "error") {
          setIsLoading(false);
          setError(data.error);
          return;
        }

        try {
          setBody(JSON.parse(data.body));
          const statusCode = data.statusCodes[0].statusCode;
          const performance = data.performance.responseTimes[0].timeInMs;
          const size = data.contentSizes[0].sizeInBytes;
          setApiMetrics({ status: statusCode, time: performance, size: size });
          setHeaders(convertHeadersToTableData(data.headers));
          setError(null); // Clear any previous errors
        } catch (error) {
          console.log("error", error);
          setError("Failed to parse response data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener("message", messageListener);

    return () => window.removeEventListener("message", messageListener);
  }, []);

  if (isLoading) {
    return (
      <div className="spinner-container">
        <ProgressSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ width: "100%" }}>
      <TabView>
        <TabPanel header="Response">
          <div className="status-info mb-3" style={{ width: "100%" }}>
            <div
              className="flex justify-content-between align-items-center"
              style={{ width: "200px" }}>
              <p className={classNames("m-0", "text-green-400")}>{apiMetrics.status}</p>
              <p className={classNames("m-0", "text-gray-400")}>{apiMetrics.time}ms</p>
              <p className={classNames("m-0", "text-gray-400")}>{apiMetrics.size}B</p>
            </div>
            <div className="icon-box">
              <div className="flex icon-box-toggle">
                <div
                  className={classNames("bordered-icon", {
                    highlighted: highlightedIcon === "code",
                  })}
                  onClick={() => toggleIcon("code")}>
                  <JsonIcon
                    fill={highlightedIcon === "code" ? "" : "#FFFFFF"}
                    width="1rem"
                    height="1rem"
                  />
                </div>
                <div
                  className={classNames("bordered-icon", {
                    highlighted: highlightedIcon === "table",
                  })}
                  onClick={() => toggleIcon("table")}>
                  <GridIcon fill="#FFFFFF" width="1rem" height="1rem" />
                </div>
              </div>

              <div
                className={classNames("bordered-icon", {
                  highlighted: highlightedIcon === "clone",
                })}>
                <CopyIcon fill="#FFFFFF" width="1.5rem" height="1.5rem" />
              </div>
              <div className={classNames({ highlighted: highlightedIcon === "info" })}>
                <LogsIcon fill="#FFFFFF" width="1rem" height="1rem" />
              </div>
            </div>
          </div>

          <div>
            <ReactJson src={body} theme={"monokai"} displayDataTypes={false} />
          </div>
        </TabPanel>
        <TabPanel header="Headers">
          <div className="card">
            <DataTable value={headers} tableStyle={{ minWidth: "50rem" }}>
              <Column field="header" header="Header"></Column>
              <Column field="value" header="Value"></Column>
            </DataTable>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};

export default Response;
