import { HTTPError } from '@segment/actions-core/request-client'

export interface ResponseError extends HTTPError {
  response: HTTPError['response'] & {
    data: {
      code: string | number
      message: string
      more_info: string
      status?: number
      statusCode?: number
      errors?: {
        message: string
      }[]
    }
    headers?: Response['headers']
  }
  code?: string
  status?: number
}

export interface ErrorDetails {
  message: string
  code: string
  status?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorDetails(error: any): ErrorDetails {
  //example of errors are here: https://segment.atlassian.net/browse/CHANNELS-819
  // each API may have its own response.data structure. E.g. Twilio has code, message, more_info, status, while Sendgrid has array of errors where each has `message`, `field`, `help`.
  const respError = error as ResponseError
  const status =
    respError.status ||
    respError.response?.status ||
    respError.response?.data?.status ||
    respError.response?.data?.statusCode
  const code = respError.code || respError?.response?.data?.code
  const message = [
    respError.name || respError.constructor?.name,
    respError.message,
    respError.response?.statusText && !respError.message.includes(respError.response?.statusText)
      ? respError.response?.statusText
      : undefined,

    // Api specific error messages (later should be abstracted in EngageActionPerformer and implemented separately for TwilioMessageSender and sendgrid/SendEmailPerformer)
    respError?.response?.data?.message, //twilio
    respError?.response?.data?.errors?.[0]?.message //sendgrid
  ]
    .filter(Boolean)
    .join('; ')
  return { status, code: code.toString(), message }
}
