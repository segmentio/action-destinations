import { HTTPError } from '@segment/actions-core/request-client'

export interface ResponseError extends HTTPError {
  response: HTTPError['response'] & {
    data: {
      code: string
      message: string
      more_info: string
      status?: number
      statusCode?: number
    }
    headers?: Response['headers']
  }
  code?: string
  status?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorDetails(error: any) {
  const respError = error as ResponseError
  const status =
    respError.response?.data?.status ||
    respError.response?.data?.statusCode ||
    respError.response?.status ||
    respError.status
  const code = respError?.response?.data?.code || respError.code
  const message = [respError.name || respError.constructor?.name, respError.message, respError?.response?.data?.message]
    .filter(Boolean)
    .join(' - ')
  return { status, code, message }
}
