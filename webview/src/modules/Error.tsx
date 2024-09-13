import { Message } from "primereact/message"

import React, { useRef } from "react"

interface ErrorProps {
  error: string
}

const Error: React.FC<ErrorProps> = ({ error }) => {
  return (
    <div>
      <Message severity="error" text={error} />
    </div>
  )
}

export default Error
