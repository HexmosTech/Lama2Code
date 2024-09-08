import React from "react";
import { classNames } from "primereact/utils";
import { Tooltip } from "primereact/tooltip"

interface IconPanelProps {
  highlightedIcon: string
  toggleIcon: (icon: string) => void
  isHtmlContent: boolean
  copyL2Command: () => void
  copyContent: () => void
}

const IconPanel: React.FC<IconPanelProps> = ({
  highlightedIcon,
  toggleIcon,
  isHtmlContent,
  copyL2Command,
  copyContent,
}) => (
  <div className="icon-box">
    {/* <div className="icon-box-toggle">
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
    </div> */}
    <Tooltip target=".copy-icon" showDelay={1000} />
    <div
      className="bordered-icon copy-icon"
      onClick={copyContent}
      data-pr-tooltip="Copy content"
      data-pr-position="top"
      data-pr-at="center+2 top-2"
      data-pr-my="center bottom">
      <i className="codicon codicon-copy"></i>
    </div>
    <Tooltip target=".debug-icon" showDelay={1000} />
    <div
      className="bordered-icon debug-icon"
      onClick={copyL2Command}
      data-pr-tooltip="Copy L2 command"
      data-pr-position="top"
      data-pr-at="center+2 top-2"
      data-pr-my="center bottom">
      <i className="codicon codicon-debug-console"></i>
    </div>
  </div>
)

export default IconPanel;
