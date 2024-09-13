import React from "react"
import { classNames } from "primereact/utils"

interface MetadataProps {
  status: string
  time: string
  size: string
}

const Metadata: React.FC<MetadataProps> = ({ status, time, size }) => {
  const isError = parseInt(status) >= 400

  return (
    <div className="status-info mb-3" style={{ width: "100%" }}>
      <div className="flex justify-content-between align-items-center" style={{ width: "200px" }}>
        <p
          className={classNames("m-0", {
            "text-green-400": !isError,
            "text-red-500": isError,
          })}
        >
          {status}
        </p>
        <p className={classNames("m-0", "text-gray-400")}>{time}ms</p>
        <p className={classNames("m-0", "text-gray-400")}>{size}B</p>
      </div>
    </div>
  )
}

export default Metadata
