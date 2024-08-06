import { useState } from "preact/hooks";
import { TabView, TabPanel } from "primereact/tabview";
import { classNames } from "primereact/utils";
import ReactJson from "react-json-view";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
// @ts-ignore
import JsonIcon from "@/assets/json.js";
// @ts-ignore
import GridIcon from "@/assets/grid.js";
// @ts-ignore
import CopyIcon from "@/assets/copy.js";
// @ts-ignore
import LogsIcon from "@/assets/logs.js";
// dark theme
// import "primereact/resources/themes/saga-blue/theme.css";

// import "primereact/resources/themes/viva-dark/theme.css"
// import "primereact/resources/themes/lara-dark-teal/theme.css";

const Response = () => {
  const object = {
    result: {
      success: true,
      message: "Successfully obtained org member",
      om: {
        UserPointer: {
          __type: "Pointer",
          className: "_User",
          objectId: "5XBNbmExny",
        },
        email: "abc@gmail.com",
        organization: "4uPBk93xBM",
        team: "Feedzap",
        is_admin: true,
        isActive: true,
        createdAt: "2024-03-15T14:05:21.684Z",
        updatedAt: "2024-07-17T14:29:04.016Z",
        first_name: "ABC",
        last_name: "CDS",
        objectId: "6YCPrvfeIF",
        __type: "Object",
        className: "OrgMember",
      },
      org: {
        orgName: "Hexmos",
        orgEmail: "info@hexmos.com",
        orgLocation: "bangalore",
        createdAt: "2022-12-01T15:43:47.525Z",
        updatedAt: "2024-07-10T14:06:05.527Z",
        stripeCustomerId: "cus_NWE7nsOGBclBG3",
        extraParams: "{}",
        logo: "https://hexmos.com/static/hexmosofficiallogo.svg",
        objectId: "4uPBk93xBM",
        __type: "Object",
        className: "Organization",
      },
      fbu: {
        userPointer: {
          __type: "Pointer",
          className: "_User",
          objectId: "5XBNbmExny",
        },
        organizationTitlePointer: {
          __type: "Pointer",
          className: "OrganizationTitles",
          objectId: "Uisl4dgiZl",
        },
        orgMemberPointer: {
          __type: "Pointer",
          className: "OrgMember",
          objectId: "6YCPrvfeIF",
        },
        organizationPointer: {
          __type: "Pointer",
          className: "Organization",
          objectId: "4uPBk93xBM",
        },
        organizationProfilesPointer: {
          __type: "Pointer",
          className: "OrganizationProfiles",
          objectId: "CkAm4Atwck",
        },
        licencePointer: {
          __type: "Pointer",
          className: "Licence",
          objectId: "kmSrZAWedr",
        },
        isActive: true,
        isDeleted: false,
        createdAt: "2024-03-15T14:05:30.273Z",
        updatedAt: "2024-07-17T14:27:36.304Z",
        teamsPointer: {
          __type: "Pointer",
          className: "Teams",
          objectId: "lEOc7Kv1zK",
        },
        objectId: "TXaPpeEaiY",
        __type: "Object",
        className: "FeedbackUser",
      },
    },
  };
  const tableData = [
    { header: "date", value: "Sat, 03 Aug 2024 09:44:06 GMT" },
    { header: "content-type", value: "application/json" },
    { header: "content-length", value: "821" },
    { header: "connection", value: "close" },
    { header: "server", value: "gunicorn/19.9.0" },
    { header: "access-control-allow-origin", value: "*" },
    { header: "access-control-allow-credentials", value: "true" },
  ];
 const [highlightedIcon, setHighlightedIcon] = useState("code");

 const toggleIcon = (icon:string) => {
   setHighlightedIcon(icon);
 };
  return (
    <div className="card" style={{ width: "100%" }}>
      <TabView>
        <TabPanel header="Response">
          <div className="status-info mb-3" style={{ width: "80%" }}>
            <div
              className="flex justify-content-between align-items-center"
              style={{ width: "200px" }}>
              <p className={classNames("m-0", "text-green-400")}>200</p>
              <p className={classNames("m-0", "text-gray-400")}>700ms</p>
              <p className={classNames("m-0", "text-gray-400")}>123B</p>
            </div>
            <div className="icon-box">
              <div className="flex icon-box-toggle">
                <div
                  className={classNames("bordered-icon", {
                    highlighted: highlightedIcon === "code",
                  })}
                  onClick={() => toggleIcon("code")}>
                  <JsonIcon fill="#FFFFFF" width="1rem" height="1rem" />
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
                <CopyIcon fill="#FFFFFF" width="1rem" height="1rem" />
              </div>
              <div className={classNames({ highlighted: highlightedIcon === "info" })}>
                <LogsIcon fill="#FFFFFF" width="1rem" height="1rem" />
              </div>
            </div>
          </div>

          <div>
            <ReactJson src={object} theme={"monokai"} displayDataTypes={false} />
          </div>
        </TabPanel>
        <TabPanel header="Headers">
          <div className="card">
            <DataTable value={tableData} tableStyle={{ minWidth: "50rem" }}>
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


