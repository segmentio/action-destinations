export interface TwilioApiError extends Error {
  response: {
    data: {
      code: number
      message: string
      more_info: string
      status: number
    }
    headers?: Response['headers']
  }
  code?: number
  status?: number
  statusCode?: number
}
