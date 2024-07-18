import dayjs from '../../lib/dayjs'
import isPlainObject from 'lodash/isPlainObject'
import { fullFormats } from 'ajv-formats/dist/formats'

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
    '(\\.\\d{1,6})?' + // Match .sssss
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

export const sendBatch = <Payload extends BasePayload>(request: Function, options: RequestPayload<Payload>[]) => {
  if (!options?.length) {
    return
  }

  const [{ settings }] = options
  const batch = options.map((opts) => buildPayload(opts))

  return request(`${trackApiEndpoint(settings)}/api/v2/batch`, {
    method: 'post',
    json: {
      batch
    }
  })
}

export const sendSingle = <Payload extends BasePayload>(request: Function, options: RequestPayload<Payload>) => {
  const json = buildPayload(options)

  return request(`${trackApiEndpoint(options.settings)}/api/v2/entity`, {
    method: 'post',
    json
  })
}
