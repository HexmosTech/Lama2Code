import React from "react";
import ReactJson from "react-json-view";

interface JsonViewProps {
  data: object;
}

const JsonView: React.FC<JsonViewProps> = ({ data }) => (
  <ReactJson src={data} theme="monokai" displayDataTypes={false} name={false} />
)

export default JsonView;
