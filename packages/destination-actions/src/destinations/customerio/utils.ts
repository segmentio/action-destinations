import dayjs from '../../lib/dayjs'
import isPlainObject from 'lodash/isPlainObject'
import { fullFormats } from 'ajv-formats/dist/formats'
import { ErrorCodes, getErrorCodeFromHttpStatus, HTTPError, IntegrationError, MultiStatusResponse, RequestClient } from '@segment/actions-core'
import { CUSTOMERIO_TRACK_API_VERSION } from './versioning-info'

const isEmail = (value: string): boolean => {
  return (fullFormats.email as RegExp).test(value)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return isPlainObject(value)
}

const isIsoDate = (value: string): boolean => {
  //https://github.com/segmentio/isostring/blob/master/index.js
  const isoformat =
    '^\\d{4}-\\d{2}-\\d{2}' + // Match YYYY-MM-DD
    '((T\\d{2}:\\d{2}(:\\d{2})?)' + // Match THH:mm:ss
    '(\\.\\d{1,9})?' + // Match .sssssss
    '(Z|(\\+|-)\\d{2}:?\\d{2})?)?$' // Time zone (Z or ±hh:mm or ±hhmm)

  const matcher = new RegExp(isoformat)

  return typeof value === 'string' && matcher.test(value) && !isNaN(Date.parse(value))
}

export const trackApiEndpoint = ({ accountRegion }: { accountRegion?: string }) => {
  if (accountRegion === AccountRegion.EU) {
    return 'https://track-eu.customer.io'
  }

  return 'https://track.customer.io'
}

export enum AccountRegion {
  US = 'US 🇺🇸',
  EU = 'EU 🇪🇺'
}

export const convertValidTimestamp = <Value = unknown>(value: Value): Value | number => {
  // Timestamps may be on a `string` field, so check if the string is only
  // numbers. If it is, ignore it since it's probably already a unix timestamp.
  // DayJS doesn't parse unix timestamps correctly outside of the `.unix()`
  // initializer.
  if (typeof value !== 'string' || /^\d+$/.test(value)) {
    return value
  }

  const maybeDate = dayjs.utc(value)

  if (maybeDate.isValid()) {
    return maybeDate.unix()
  }

  return value
}

// Recursively walk through an object and try to convert any strings into dates
export const convertAttributeTimestamps = <Payload extends {}>(payload: Payload): Payload => {
  const clone = {} as Payload
  const keys = Object.keys(payload)

  keys.forEach((k) => {
    const key = k as keyof Payload
    const value = payload[key]

    if (typeof value === 'string') {
      // Parse only ISO 8601 date formats in strict mode
      const maybeDate = dayjs(value)

      if (isIsoDate(value)) {
        ;(clone[key] as unknown) = maybeDate.unix()
        return
      }
    }

    if (isRecord(value)) {
      clone[key] = convertAttributeTimestamps(value)

      return
    }

    clone[key] = value
  })

  return clone
}

type RequestPayload<Payload> = {
  settings: {
    accountRegion?: string
    trackEndpoint?: string
  }
  type: string
  action: string
  payload: Payload
}

type Identifiers = {
  anonymous_id?: string
  cio_id?: string
  email?: string
  id?: string
  object_id?: string
  object_type_id?: string
  primary?: Identifiers
  secondary?: Identifiers
}

type BasePayload = {
  anonymous_id?: string
  convert_timestamp?: boolean
  email?: string
  object_id?: string
  object_type_id?: string
  person_id?: string
  primary?: Identifiers
  secondary?: Identifiers
  timestamp?: string | number
}

export const buildPayload = <Payload extends BasePayload>({ action, type, payload }: RequestPayload<Payload>) => {
  const { convert_timestamp, person_id, anonymous_id, email, object_id, object_type_id, timestamp, ...data } = payload
  let rest = data

  // Remove batching configuration fields that shouldn't be sent to Customer.io
  if ('enable_batching' in rest) {
    delete rest.enable_batching
  }
  if ('batch_size' in rest) {
    delete rest.batch_size
  }

  if ('convert_timestamp' in payload && convert_timestamp !== false) {
    rest = convertAttributeTimestamps(rest)
  }

  // Customer.io only accepts timestamps in unix format so it must always be converted regardless of the `convert_timestamp` setting.
  if ('timestamp' in payload && timestamp) {
    rest = { ...rest, timestamp: convertValidTimestamp(timestamp) }
  }

  const body: {
    attributes?: Record<string, unknown>
    cio_relationships?: Record<string, unknown>[]
    identifiers?: Identifiers
    type: string
    action: string
    object_id?: string
    object_type_id?: string
  } = {
    type,
    action,
    ...rest
  }

  if (anonymous_id) {
    body.attributes = { ...body.attributes, anonymous_id: anonymous_id }
  }

  // `merge` is the only action that does not require identifiers at the root level.
  if (action !== 'merge') {
    body.identifiers = resolveIdentifiers({ anonymous_id, email, object_id, object_type_id, person_id })
  }

  // Remove unnecessary anonymous_id attribute if it's also in the identifiers object.
  if (body.identifiers && 'anonymous_id' in body.identifiers) {
    delete body.attributes?.anonymous_id
  }

  return body
}

export const resolveIdentifiers = ({
  anonymous_id,
  email,
  object_id,
  object_type_id = '1',
  person_id
}: Record<string, unknown>): Identifiers | undefined => {
  if (object_id && object_type_id) {
    return {
      object_id: object_id as string,
      object_type_id: object_type_id as string
    }
  } else if ((person_id as string)?.startsWith('cio_')) {
    return { cio_id: (person_id as string).slice(4) }
  } else if (isEmail(person_id as string)) {
    return { email: person_id as string }
  } else if (person_id) {
    return { id: person_id as string }
  } else if (email) {
    return { email: email as string }
  } else if (anonymous_id) {
    return { anonymous_id: anonymous_id as string }
  }
}

export const sendBatch = async <Payload extends BasePayload>(
  request: RequestClient,
  options: RequestPayload<Payload>[]
): Promise<MultiStatusResponse> => {
  if (!options?.length) {
    return new MultiStatusResponse()
  }

  const [{ settings }] = options
  const batch = options.map((opts) => buildPayload(opts))

  try {
    const response = await request<CustomerIOBatchResponse>(
      `${trackApiEndpoint(settings)}/api/${CUSTOMERIO_TRACK_API_VERSION}/batch`,
      {
        method: 'post',
        json: {
          batch
        }
      }
    )

    const parsedResults = parseTrackApiMultiStatusResponse(response.data, options, batch)
    if (parsedResults) {
      return parsedResults
    }

    throw new IntegrationError(
      'Customer.io Track API batch response did not include an errors array',
      'INVALID_RESPONSE',
      502
    )
  } catch (err) {
    // Retryable HTTP errors (408 Request Timeout, 429 Too Many Requests, 5xx Server Errors)
    // and unexpected non-HTTP errors should be rethrown so the framework's retry wrapper
    // can handle them. Only convert to per-item errors for non-retryable HTTP failures.
    if (err instanceof HTTPError) {
      const status = err.response.status
      if (status === 408 || status === 429 || status >= 500) {
        throw err
      }

      const responseBody = err.response?.data as { message?: string } | undefined
      const message = responseBody?.message ?? err.message ?? 'Unknown error'
      const errortype = mapHttpStatusToErrorCode(status)
      const multiStatusResponse = new MultiStatusResponse()
      for (let i = 0; i < options.length; i++) {
        multiStatusResponse.setErrorResponseAtIndex(i, {
          status,
          errortype,
          errormessage: message,
          body: options[i].payload,
          sent: batch[i]
        })
      }
      return multiStatusResponse
    }

    // Non-HTTP errors are unexpected - rethrow so the framework can handle/retry them
    throw err
  }
}

interface TrackApiError {
  batch_index?: number
  reason?: string
  field?: string
  message?: string
}

interface CustomerIOBatchResponse {
  errors?: TrackApiError[]
}

function mapHttpStatusToErrorCode(status: number): keyof typeof ErrorCodes {
  return getErrorCodeFromHttpStatus(status)
}

function mapTrackApiReasonToErrorCode(reason: string | undefined) {
  switch (reason?.toLowerCase()) {
    case 'invalid':
    case 'required':
      return ErrorCodes.PAYLOAD_VALIDATION_FAILED
    default:
      return ErrorCodes.UNKNOWN_ERROR
  }
}

export function parseTrackApiErrors<Payload extends BasePayload>(
  errors: TrackApiError[],
  options: RequestPayload<Payload>[],
  batch: Record<string, unknown>[]
): MultiStatusResponse {
  const multiStatusResponse = new MultiStatusResponse()
  const errorMap = new Map<number, TrackApiError[]>()
  const unindexableErrors: TrackApiError[] = []

  for (const error of errors) {
    const batchIndex = error.batch_index

    if (!Number.isInteger(batchIndex) || (batchIndex as number) < 0 || (batchIndex as number) >= options.length) {
      unindexableErrors.push(error)
      continue
    }

    const existing = errorMap.get(batchIndex as number)
    if (existing) {
      existing.push(error)
    } else {
      errorMap.set(batchIndex as number, [error])
    }
  }

  if (unindexableErrors.length > 0) {
    const errormessage = unindexableErrors
      .map((e) => {
        const indexDesc = typeof e.batch_index === 'number' ? `batch_index ${e.batch_index}` : 'missing batch_index'
        return e.message || `${e.reason || 'ERROR'}: ${e.field || 'unknown field'} (${indexDesc})`
      })
      .join('; ')

    throw new IntegrationError(
      `Customer.io returned batch errors that could not be mapped to request items: ${errormessage}`,
      'INVALID_RESPONSE',
      502
    )
  }

  for (let i = 0; i < options.length; i++) {
    const indexErrors = errorMap.get(i)

    if (!indexErrors) {
      multiStatusResponse.setSuccessResponseAtIndex(i, {
        status: 200,
        body: options[i].payload,
        sent: batch[i]
      })
      continue
    }

    const errormessage = indexErrors
      .map((e) => e.message || `${e.reason || 'ERROR'}: ${e.field || 'unknown field'}`)
      .join('; ')

    // Use the reason from the first error for error code mapping (all errors for the same
    // batch_index are expected to share the same underlying reason class)
    const errortype = mapTrackApiReasonToErrorCode(indexErrors[0].reason)

    multiStatusResponse.setErrorResponseAtIndex(i, {
      status: 400,
      errormessage,
      errortype,
      body: options[i].payload,
      sent: batch[i]
    })
  }

  return multiStatusResponse
}

export function parseTrackApiMultiStatusResponse<Payload extends BasePayload>(
  responseBody: CustomerIOBatchResponse | undefined,
  options: RequestPayload<Payload>[],
  batch: Record<string, unknown>[]
): MultiStatusResponse | null {
  if (!isRecord(responseBody)) {
    return null
  }

  const { errors } = responseBody as CustomerIOBatchResponse
  if (!Array.isArray(errors)) {
    return null
  }

  return parseTrackApiErrors(errors, options, batch)
}

export const sendSingle = <Payload extends BasePayload>(request: RequestClient, options: RequestPayload<Payload>) => {
  const json = buildPayload(options)
  return request(`${trackApiEndpoint(options.settings)}/api/${CUSTOMERIO_TRACK_API_VERSION}/entity`, {
    method: 'post',
    json
  })
}

export { isIsoDate }
