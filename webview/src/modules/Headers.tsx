import React from "react";
import { TabView, TabPanel } from "primereact/tabview";

interface HeaderProps {
  responseContent: React.ReactNode;
  headersContent: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ responseContent, headersContent }) => (
  <div className="card" style={{ width: "100%" }}>
    <TabView>
      <TabPanel header="Response">{responseContent}</TabPanel>
      <TabPanel header="Headers">{headersContent}</TabPanel>
    </TabView>
  </div>
);

export default Header;
