export interface ResponseError extends Error {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorStatusCode(error: any) {
  const respError = error as ResponseError
  const status = respError?.response?.data?.status || respError.status || respError?.statusCode
  const code = respError?.response?.data?.code || respError.code
  return { status, code }
}
