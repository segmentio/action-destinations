import dayjs from '../../lib/dayjs'
import isPlainObject from 'lodash/isPlainObject'
import { fullFormats } from 'ajv-formats/dist/formats'
import { HTTPError, JSONLikeObject, ModifiedResponse, MultiStatusResponse } from '@segment/actions-core'
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

  if (typeof value !== 'string' || !matcher.test(value)) {
    return false
  }

  // Date.parse rejects >5-digit fractional seconds. truncate to avoid this issue
  const truncated = value.replace(/\.(\d{1,9})/, (_: string, ms: string) => `.${ms.slice(0, 3)}`)

  return !isNaN(Date.parse(truncated))
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
  // digits (optionally with a fractional part). If it is, ignore it since
  // it's probably already a unix timestamp (integer or decimal).
  // DayJS doesn't parse unix timestamps correctly outside of the `.unix()`
  // initializer.
  if (typeof value !== 'string' || /^\d+(\.\d+)?$/.test(value)) {
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
  request: Function,
  options: RequestPayload<Payload>[]
): Promise<MultiStatusResponse> => {
  if (!options?.length) {
    return new MultiStatusResponse()
  }

  const [{ settings }] = options
  const batch = options.map((opts) => buildPayload(opts))

  try {
    const response: ModifiedResponse<CustomerIOBatchResponse> = await request(
      `${trackApiEndpoint(settings)}/api/${CUSTOMERIO_TRACK_API_VERSION}/batch`,
      {
        method: 'post',
        json: {
          batch
        }
      }
    )

    return buildBatchMultiStatusResponse(batch as JSONLikeObject[], response)
  } catch (error) {
    const handled = buildBatchMultiStatusErrorResponse(batch as JSONLikeObject[], error)

    if (handled) {
      return handled
    }

    // 5xx, 429, auth failures, network errors, etc: let the framework handle (and retry) the whole batch.
    throw error
  }
}

export const sendSingle = <Payload extends BasePayload>(request: Function, options: RequestPayload<Payload>) => {
  const json = buildPayload(options)
  return request(`${trackApiEndpoint(options.settings)}/api/${CUSTOMERIO_TRACK_API_VERSION}/entity`, {
    method: 'post',
    json
  })
}

export { isIsoDate }

// A single error entry returned by the Customer.io Track v2 `/batch` endpoint, either in a
// 207 Multi-Status body (partial failure) or a 4xx body (whole request rejected).
// `batch_index` is the 0-based index into the submitted `batch` array; it may be omitted for
// request-level errors.
type CustomerIOBatchError = {
  batch_index?: number
  reason?: string
  field?: string
  message?: string
}

type CustomerIOBatchResponse = {
  errors?: CustomerIOBatchError[]
}

const formatBatchError = (error: CustomerIOBatchError): string => {
  const parts = [error.reason, error.field ? `field: ${error.field}` : undefined, error.message].filter(
    (part): part is string => typeof part === 'string' && part.length > 0
  )

  return parts.length ? parts.join(' - ') : 'Unknown error'
}

const getBatchErrors = (data?: CustomerIOBatchResponse): CustomerIOBatchError[] | undefined => {
  const errors = data?.errors

  return Array.isArray(errors) ? errors : undefined
}

// Groups errors by the batch entry they refer to. Errors with a missing or out-of-range
// `batch_index` are returned separately as request-level errors.
const groupBatchErrors = (errors: CustomerIOBatchError[], batchLength: number) => {
  const byIndex = new Map<number, CustomerIOBatchError[]>()
  const requestLevel: CustomerIOBatchError[] = []

  for (const error of errors) {
    const index = error.batch_index

    if (typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < batchLength) {
      byIndex.set(index, [...(byIndex.get(index) ?? []), error])
    } else {
      requestLevel.push(error)
    }
  }

  return { byIndex, requestLevel }
}

const buildBatchMultiStatusResponse = (
  batch: JSONLikeObject[],
  response: ModifiedResponse<CustomerIOBatchResponse>
): MultiStatusResponse => {
  const multiStatusResponse = new MultiStatusResponse()
  const { byIndex, requestLevel } = groupBatchErrors(getBatchErrors(response?.data) ?? [], batch.length)

  batch.forEach((sent, index) => {
    // An error that cannot be tied to an entry (missing or out-of-range `batch_index`) is treated as a
    // request-level failure: every entry without an error of its own fails with that message.
    const entryErrors = byIndex.get(index) ?? (requestLevel.length ? requestLevel : undefined)

    if (entryErrors) {
      const errormessage = entryErrors.map(formatBatchError).join('; ')

      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage,
        sent,
        body: { errors: entryErrors } as JSONLikeObject
      })
    } else {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent,
        body: 'success'
      })
    }
  })

  return multiStatusResponse
}

// Structural check rather than `instanceof` alone: the local dev server reloads the destination with a
// cleared require cache, so the HTTPError thrown by the request client can come from a different copy
// of actions-core than the one this module imported.
const isHttpError = (error: unknown): error is HTTPError => {
  if (error instanceof HTTPError) {
    return true
  }

  return error instanceof Error && error.name === 'HTTPError' && 'response' in error
}

// Converts a 4xx HTTPError whose body carries the Track API `errors` array into a per-entry
// MultiStatusResponse. Returns undefined for anything else so the caller rethrows it.
const buildBatchMultiStatusErrorResponse = (
  batch: JSONLikeObject[],
  error: unknown
): MultiStatusResponse | undefined => {
  if (!isHttpError(error)) {
    return undefined
  }

  const status = error.response?.status

  if (typeof status !== 'number' || status < 400 || status >= 500 || status === 429) {
    return undefined
  }

  const errors = getBatchErrors((error.response as ModifiedResponse<CustomerIOBatchResponse>)?.data)

  // No `errors` array, or an empty one, is not the Track API validation shape: rethrow so the
  // framework handles the whole batch.
  if (!errors?.length) {
    return undefined
  }

  const multiStatusResponse = new MultiStatusResponse()
  const { byIndex, requestLevel } = groupBatchErrors(errors, batch.length)
  const requestLevelMessage = requestLevel.length ? requestLevel.map(formatBatchError).join('; ') : error.message

  batch.forEach((sent, index) => {
    const entryErrors = byIndex.get(index)

    multiStatusResponse.setErrorResponseAtIndex(index, {
      status,
      errormessage: entryErrors ? entryErrors.map(formatBatchError).join('; ') : requestLevelMessage,
      sent,
      body: { errors: entryErrors ?? requestLevel } as JSONLikeObject
    })
  })

  return multiStatusResponse
}
