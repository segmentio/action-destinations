interface AdditionalError {
  message: string
  errorcode: number
  documentation: string
}

interface ErrorData {
  additionalErrors: AdditionalError[]
  message: string
}

interface ErrorResponseData {
  message: string
  errorcode: number
  documentation: string
  data: ErrorData
  status: number
}

export interface ErrorResponse {
  response: ErrorResponseData
}
