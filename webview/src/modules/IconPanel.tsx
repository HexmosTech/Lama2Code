import React from "react";
import { classNames } from "primereact/utils";

interface IconPanelProps {
  highlightedIcon: string
  toggleIcon: (icon: string) => void
  isHtmlContent: boolean
  showTerminal: () => void
  copyContent: () => void
}

const IconPanel: React.FC<IconPanelProps> = ({
  highlightedIcon,
  toggleIcon,
  isHtmlContent,
  showTerminal,
  copyContent,
}) => (
  <div className="icon-box">
    <div className="icon-box-toggle">
      <div
        className={classNames("bordered-icon", {
          highlighted: highlightedIcon === "code",
          disabled: isHtmlContent,
        })}
        onClick={() => !isHtmlContent && toggleIcon("code")}>
        <i className="codicon codicon-json"></i>
      </div>
      <div
        className={classNames("bordered-icon", {
          highlighted: highlightedIcon === "table",
          disabled: isHtmlContent,
        })}
        onClick={() => !isHtmlContent && toggleIcon("table")}>
        <i className="codicon codicon-table"></i>
      </div>
    </div>
    <div className="bordered-icon" onClick={copyContent}>
      <i className="codicon codicon-copy"></i>
    </div>
    <div className="bordered-icon" onClick={showTerminal}>
      <i className="codicon codicon-debug-console"></i>
    </div>
  </div>
)

export default IconPanel;
