export interface ResponseError extends Error {
  response: {
    data: {
      code: string
      message: string
      more_info: string
      status: number
    }
    headers?: Response['headers']
  }
  code?: string
  status?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorDetails(error: any) {
  const respError = error as ResponseError
  const status = respError?.response?.data?.status || respError.status
  const code = respError?.response?.data?.code || respError.code
  const message = [respError.message, respError?.response?.data?.message].filter(Boolean).join(': ')
  return { status, code, message }
}
