import React from "react"

interface HtmlViewProps {
  content: string
}

const HtmlView: React.FC<HtmlViewProps> = ({ content }) => (
  <div className="html-content-container" dangerouslySetInnerHTML={{ __html: content }} />
)

export default HtmlView
