import {
  RequestClient,
  InvalidAuthenticationError,
  RetryableError,
  IntegrationError,
  ErrorCodes
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { MarketoResponseError, MarketoRecordError, MarketoSubmitFormResponse, MarketoJSON } from './types'
import {
  SUBMIT_FORM_ENDPOINT,
  AUTH_ERROR_CODES,
  ResponseLevelErrorRetryableCode,
  RecordLevelErrorRetryableCode
} from './constants'

// Marketo's Forms API only accepts flat primitive values, so drop nullish entries as well
// as any nested objects/arrays. This keeps the declared return type honest.
function removeEmpty(obj: Record<string, unknown>): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
    )
  ) as Record<string, string | number | boolean>
}

// Response-level errors: top-level `errors[]`, present only when `success: false`.
function getResponseErrors(body: MarketoSubmitFormResponse): MarketoResponseError[] {
  return body.errors ?? []
}

// Record-level errors: `result[].reasons[]` on skipped records, even when `success: true`.
function getRecordErrors(body: MarketoSubmitFormResponse): MarketoRecordError[] {
  const errors: MarketoRecordError[] = []
  for (const item of body.result ?? []) {
    if (item.status === 'skipped' && item.reasons?.length) {
      errors.push(...item.reasons)
    }
  }
  return errors
}

function formatErrors(errors: { code: string; message: string }[]): string {
  return errors.map((e) => `${e.code}: ${e.message}`).join('; ') || 'Unknown Marketo error'
}

// Marketo returns HTTP 200 even on failure, with the real error code in the body at one
// of two levels. We check each level separately because the same numeric ranges and the
// retry rules differ between them.
function handleResponse(body: MarketoSubmitFormResponse) {
  const responseErrors = getResponseErrors(body)
  const recordErrors = getRecordErrors(body)

  if (body.success && recordErrors.length === 0) {
    return
  }

  // --- Response-level handling (whole request failed) ---
  const responseCodes = responseErrors.map((e) => e.code)
  const responseMessage = formatErrors(responseErrors)

  // Token invalid/expired. Throwing an auth error (status 401) signals the platform to
  // refresh the OAuth2 token via refreshAccessToken and retry the request.
  if (responseCodes.some((code) => AUTH_ERROR_CODES.has(code))) {
    throw new InvalidAuthenticationError(responseMessage, ErrorCodes.INVALID_AUTHENTICATION)
  }

  if (responseCodes.some((code) => ResponseLevelErrorRetryableCode.has(code))) {
    throw new RetryableError(`Transient Marketo response error, retrying: ${responseMessage}`)
  }

  // --- Record-level handling (request ok, individual record skipped) ---
  const recordCodes = recordErrors.map((e) => e.code)
  const recordMessage = formatErrors(recordErrors)

  if (recordCodes.some((code) => RecordLevelErrorRetryableCode.has(code))) {
    throw new RetryableError(`Transient Marketo record error, retrying: ${recordMessage}`)
  }

  // Everything else is a permanent failure the user must fix.
  const message = responseErrors.length ? responseMessage : recordMessage
  throw new IntegrationError(message, ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
}

export async function send(request: RequestClient, settings: Settings, payload: Payload) {
  const { formId, email, leadFormFields, visitorData, cookie } = payload

  const json: MarketoJSON = {
    input: [
      {
        leadFormFields: removeEmpty(leadFormFields),
        // The action requires `email`, so always inject it into visitorData rather than
        // relying on the user to duplicate it inside the visitorData mapping.
        visitorData: { ...removeEmpty(visitorData), email },
        cookie
      }
    ],
    formId
  }

  const url = `${settings.marketo_api_domain}${SUBMIT_FORM_ENDPOINT}`

  const response = await request<MarketoSubmitFormResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    json
  })

  handleResponse(response.data)

  return response
}
