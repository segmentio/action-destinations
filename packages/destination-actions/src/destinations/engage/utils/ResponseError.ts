import { HTTPError } from '@segment/actions-core/request-client'

export interface ResponseError extends HTTPError {
  response: HTTPError['response'] & {
    data: {
      code: string
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorDetails(error: any) {
  //example of errors are here: https://segment.atlassian.net/browse/CHANNELS-819
  // each API may have its own response.data structure. E.g. Twilio has code, message, more_info, status, while Sendgrid has array of errors where each has `message`, `field`, `help`.
  const respError = error as ResponseError
  // some errors noticed to have no status and no response (e.g. ECONNRESET, ETIMEDOUT)
  // there are tests impling it supposed to be retried: https://github.com/segmentio/integrations/blob/995f96a0526c3aba051c3948c3bfc306c704aec9/src/createIntegration/test/proto.js#L728, but ETIMEDOUT were still not retried
  const status = respError.status || respError.response?.status
  // || respError.response?.data?.status // twilio apis provides status and statusCode in data, but we assume it's the same as response.status
  // || respError.response?.data?.statusCode

  const code = respError.code || respError.response?.data?.code
  // || respError.response?.statusText // e.g. 'Not Found' for 404

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
  return { status, code, message }
}
