import {
  MultiStatusResponse,
  PayloadValidationError,
  RetryableError,
  InvalidAuthenticationError,
  APIError,
  IntegrationError,
  JSONLikeObject,
  RequestClient,
  StatsContext,
  Features
} from '@segment/actions-core'
import { StateContext } from '@segment/actions-core/destination-kit'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import type {
  AudienceAction,
  AudienceJSON,
  DMPSegment,
  LinkedInCompanyAudienceElement,
  NormalizedIdentifiers,
  NormalizedTraits,
  ValidCompanyPayload
} from './types'
import {
  AUDIENCE_ACTION,
  AUDIENCE_SOURCE,
  COUNTRY_CODES,
  MAX_CITY_LENGTH,
  MAX_COMPANY_PAGE_URL_LENGTH,
  MAX_INDUSTRIES,
  MAX_INDUSTRY_LENGTH,
  MAX_POSTAL_CODE_LENGTH,
  MAX_STATE_LENGTH,
  MAX_STOCK_SYMBOL_LENGTH,
  ORGANIZATION_URN_PREFIX,
  RETRYABLE_STATUSES,
  SEGMENT_TYPES
} from './constants'

// A leading URL scheme, per the RFC 3986 grammar. Case-insensitive so the constant is correct on
// its own, rather than relying on every caller lower-casing first.
export const SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i
const TRAILING_SLASHES = /\/+$/
const TRAILING_DOT = /\.$/
// A protocol-relative prefix, as in '//microsoft.com'.
const LEADING_SLASHES = /^\/\//
// A dotted-quad IPv4 address, which passes a dot check but is not a domain.
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

export function toOrganizationUrn(linkedInCompanyId: string): string {
  let id = linkedInCompanyId.trim()
  while (id.toLowerCase().startsWith(ORGANIZATION_URN_PREFIX)) {
    id = id.slice(ORGANIZATION_URN_PREFIX.length).trim()
  }
  return `${ORGANIZATION_URN_PREFIX}${id}`
}

// Trims a value, treating one that is empty or only whitespace as absent.
function trimmed(value?: string): string | undefined {
  return value?.trim() || undefined
}

// LinkedIn's limits are enforced by dropping the value, never by shortening it. A shortened city
// or ticker is a wrong one, and as a match signal a wrong value is worse than a missing one.
function withinLength(value: string | undefined, max: number): string | undefined {
  return value && value.length <= max ? value : undefined
}

// A company domain and a company email domain are both just hostnames, and customers map the
// same three shapes into either field: a bare domain, an email address, or a page url. The
// platform url parser handles all of them, along with the scheme, userinfo, port, path, query
// and fragment, and lower-cases the host. An internationalized domain comes back in its punycode
// form, which is the spelling DNS uses.
export function normalizeDomain(value?: string): string | undefined {
  const raw = trimmed(value)
  if (!raw) {
    return undefined
  }

  let hostname: string
  try {
    hostname = new URL(SCHEME_PREFIX.test(raw) ? raw : `https://${raw}`).hostname
  } catch {
    // Not recoverable as a url, so there is no domain to send.
    return undefined
  }

  // The parser returns a hostname for anything, so it is on us to decide whether that hostname is
  // a domain. A domain is fully qualified, so it must contain a dot: that drops a company name
  // mapped here by mistake, and an IPv6 literal, which is bracketed and has none. An IPv4 address
  // is full of dots, so it needs rejecting on its own.
  const host = hostname.replace(TRAILING_DOT, '')
  return host.includes('.') && !IPV4.test(host) ? host : undefined
}

export function normalizeCompanyPageUrl(value?: string): string | undefined {
  const url = trimmed(value)?.toLowerCase()
  if (!url) {
    return undefined
  }
  // A page copied from a browser usually carries a tracking query string, which is never part of
  // the company's identity and can push an otherwise valid url past the length limit, costing us
  // the identifier altogether. The path is left alone: which segments are meaningful is
  // LinkedIn's business, not ours.
  const withoutQuery = url.replace(SCHEME_PREFIX, '').replace(LEADING_SLASHES, '').split(/[?#]/)[0]

  return withinLength(trimmed(withoutQuery.replace(TRAILING_SLASHES, '')), MAX_COMPANY_PAGE_URL_LENGTH)
}

export function normalizeIndustries(values?: string[] | string): string[] | undefined {
  // Two shapes are supported: a comma delimited string, which is parsed into its parts, or an
  // array of strings, which is used as-is.
  const list = typeof values === 'string' ? values.split(',') : values ?? []

  // An array entry can itself be comma delimited, because a single mapped value is coerced into
  // a one-element array before it reaches here, so split the entries too.
  const parts = list.flatMap((industry) => industry.split(','))

  const cleaned = parts
    .map((industry) => industry.trim())
    .filter((industry) => industry && industry.length <= MAX_INDUSTRY_LENGTH)

  // The customer's spelling is sent as-is. This is free text handed to LinkedIn's matcher, like
  // city and state, so changing it risks making the match worse. Only the duplicate check is
  // case-insensitive, and the first spelling seen wins.
  const seen = new Set<string>()
  const industries = cleaned
    .filter((industry) => {
      const duplicate = seen.has(industry.toLowerCase())
      seen.add(industry.toLowerCase())
      return !duplicate
    })
    .slice(0, MAX_INDUSTRIES)

  return industries.length ? industries : undefined
}

export function normalizeCountry(value?: string): string | undefined {
  const country = trimmed(value)?.toUpperCase()
  return country && COUNTRY_CODES.has(country) ? country : undefined
}

export function normalizeIdentifiers(payload: Payload): NormalizedIdentifiers {
  const identifiers = payload.identifiers

  const rawCompanyId = trimmed(identifiers?.linkedInCompanyId)
  const idWithoutPrefix = rawCompanyId?.toLowerCase().startsWith(ORGANIZATION_URN_PREFIX)
    ? trimmed(rawCompanyId.slice(ORGANIZATION_URN_PREFIX.length))
    : rawCompanyId

  const companyName = trimmed(identifiers?.companyName)
  const companyDomain = normalizeDomain(identifiers?.companyDomain)
  const companyEmailDomain = normalizeDomain(identifiers?.companyEmailDomain)
  const companyPageUrl = normalizeCompanyPageUrl(identifiers?.companyPageUrl)

  return {
    ...(companyName && { companyName }),
    ...(companyDomain && { companyDomain }),
    ...(companyEmailDomain && { companyEmailDomain }),
    ...(idWithoutPrefix && { linkedInCompanyId: idWithoutPrefix }),
    ...(companyPageUrl && { companyPageUrl })
  }
}

export function normalizeTraits(payload: Payload): NormalizedTraits | undefined {
  const company_traits = payload.company_traits

  if (!payload.send_company_traits) {
    return undefined
  }

  const industries = normalizeIndustries(company_traits?.industries)
  const city = withinLength(trimmed(company_traits?.city), MAX_CITY_LENGTH)
  const state = withinLength(trimmed(company_traits?.state), MAX_STATE_LENGTH)
  const country = normalizeCountry(company_traits?.country)
  const postalCode = withinLength(trimmed(company_traits?.postalCode), MAX_POSTAL_CODE_LENGTH)
  const stockSymbol = withinLength(trimmed(company_traits?.stockSymbol)?.toUpperCase(), MAX_STOCK_SYMBOL_LENGTH)

  const traits: NormalizedTraits = {
    ...(industries && { industries }),
    ...(city && { city }),
    ...(state && { state }),
    ...(country && { country }),
    ...(postalCode && { postalCode }),
    ...(stockSymbol && { stockSymbol })
  }

  return Object.keys(traits).length ? traits : undefined
}

export function validate(
  payloads: Payload[],
  msResponse: MultiStatusResponse,
  isBatch: boolean
): ValidCompanyPayload[] {
  const validPayloads: ValidCompanyPayload[] = []

  payloads.forEach((payload, index) => {
    const identifiers = normalizeIdentifiers(payload)

    let message: string | undefined
    if (!Object.keys(identifiers).length) {
      message =
        "At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required in the 'Identifiers' field."
    } else if (
      payload.dmp_company_action !== AUDIENCE_ACTION.ADD &&
      payload.dmp_company_action !== AUDIENCE_ACTION.REMOVE
    ) {
      message = `'Company Segment Action' must be exactly '${AUDIENCE_ACTION.ADD}' or '${AUDIENCE_ACTION.REMOVE}'.`
    }

    if (message) {
      if (isBatch) {
        msResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: message
        })
      } else {
        throw new PayloadValidationError(message)
      }
    } else {
      validPayloads.push({ ...payload, identifiers, company_traits: normalizeTraits(payload), index })
    }
  })

  return validPayloads
}

// Every identifier we send belongs in the key. Two payloads that would produce different request
// elements must not collapse onto one another, or one of them is silently dropped. Traits are
// deliberately excluded: the 'Send Company Traits' toggle is the customer's acknowledgement that
// only one company's traits are sent, which keeps this at one element per company.
export function companyKey(payload: ValidCompanyPayload): string {
  const { companyName, companyDomain, companyEmailDomain, linkedInCompanyId, companyPageUrl } =
    payload.identifiers ?? {}

  return JSON.stringify({
    action: payload.dmp_company_action,
    companyName,
    companyDomain,
    companyEmailDomain,
    organizationUrn: linkedInCompanyId ? toOrganizationUrn(linkedInCompanyId) : undefined,
    companyPageUrl
  })
}

export function buildJSON(payloads: ValidCompanyPayload[]): AudienceJSON<LinkedInCompanyAudienceElement> {
  const elements: LinkedInCompanyAudienceElement[] = payloads.map((payload) => {
    const { companyName, companyDomain, companyEmailDomain, linkedInCompanyId, companyPageUrl } =
      payload.identifiers ?? {}
    return {
      action: payload.dmp_company_action as AudienceAction,
      ...(companyName && { companyName }),
      ...(companyDomain && { companyWebsiteDomain: companyDomain }),
      ...(companyEmailDomain && { companyEmailDomain }),
      ...(linkedInCompanyId && { organizationUrn: toOrganizationUrn(linkedInCompanyId) }),
      ...(companyPageUrl && { companyPageUrl }),
      ...payload.company_traits
    }
  })

  return { elements }
}

export async function send(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  isBatch: boolean,
  statsContext: StatsContext | undefined,
  stateContext?: StateContext,
  features?: Features
) {
  const msResponse = new MultiStatusResponse()
  const validPayloads = validate(payloads, msResponse, isBatch)

  if (validPayloads.length === 0) {
    if (isBatch) {
      return msResponse
    }
    throw new PayloadValidationError('No valid payloads to process after validation.')
  }

  const linkedinApiClient = new LinkedInAudiences(request, features)

  const segmentId = await getCompanyDmpSegmentId(
    linkedinApiClient,
    settings,
    validPayloads[0],
    statsContext,
    stateContext
  )

  const uniquePayloads: ValidCompanyPayload[] = []
  const payloadIndexes: number[][] = []
  const keyToPosition = new Map<string, number>()
  for (const payload of validPayloads) {
    const key = companyKey(payload)
    const position = keyToPosition.get(key)
    if (position === undefined) {
      keyToPosition.set(key, uniquePayloads.length)
      uniquePayloads.push(payload)
      payloadIndexes.push([payload.index])
    } else {
      payloadIndexes[position].push(payload.index)
    }
  }

  const json = buildJSON(uniquePayloads)

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...(statsContext?.tags ?? []),
    'endpoint:add-or-remove-companies-from-dmpSegment'
  ])

  const response = await linkedinApiClient.batchUpdateCompanies(segmentId, json)

  if (response.status < 200 || response.status >= 300) {
    handleRequestError(response.status, statsContext)
  }

  if (!isBatch) {
    // LinkedIn's batch-style endpoint can return HTTP 200 while reporting a per-element failure.
    // For single-item perform, inspect the first element result and throw if it is not 2xx.
    const element = response.data?.elements?.[0]
    if (!element || element.status < 200 || element.status >= 300) {
      handleRequestError(element?.status ?? 400, statsContext, element?.error?.message)
    }
    return response
  }

  const resultElements = response.data?.elements ?? []
  uniquePayloads.forEach((_payload, i) => {
    const result = resultElements[i]
    const sent = json.elements[i] as unknown as JSONLikeObject
    payloadIndexes[i].forEach((index) => {
      if (result && result.status >= 200 && result.status < 300) {
        msResponse.setSuccessResponseAtIndex(index, {
          status: result.status,
          sent,
          body: result as unknown as JSONLikeObject
        })
      } else {
        msResponse.setErrorResponseAtIndex(index, {
          status: result?.status ?? 400,
          errortype: 'BAD_REQUEST',
          errormessage: result?.error?.message || 'LinkedIn did not return a result for this company.',
          sent,
          body: (result ?? {}) as unknown as JSONLikeObject
        })
      }
    })
  })

  return msResponse
}

function handleRequestError(status: number, statsContext: StatsContext | undefined, detail?: string): never {
  statsContext?.statsClient?.incr('linkedin_dmp_company_segment_update_error', 1, [
    ...(statsContext?.tags ?? []),
    `status_code:${status}`
  ])

  const suffix = detail ? ` LinkedIn returned: ${detail}` : ''

  if (status === 401) {
    throw new InvalidAuthenticationError(
      'Invalid LinkedIn OAuth access token. New authentication token will be requested.'
    )
  }

  if (status === 409) {
    throw new RetryableError(
      `Conflict while syncing to the LinkedIn DMP Company Segment. This event will be retried.${suffix}`,
      429
    )
  }

  // A freshly created DMP segment is not immediately available for company updates: LinkedIn
  // documents a short propagation delay and returns 404 "Could not find DMP segment with ID ..."
  // until it is ready. Retry so the now-existing segment resolves on a subsequent attempt.
  if (status === 404) {
    throw new RetryableError(
      `LinkedIn DMP Company Segment is not available yet. It may have just been created. This event will be retried.${suffix}`,
      429
    )
  }

  if (RETRYABLE_STATUSES.includes(status)) {
    throw new RetryableError(
      `Transient error while syncing to the LinkedIn DMP Company Segment. This event will be retried.${suffix}`,
      status as 408 | 423 | 429 | 500 | 502 | 503 | 504
    )
  }

  throw new APIError(
    `Failed to update LinkedIn DMP Company Segment. LinkedIn returned status ${status}.${suffix}`,
    status
  )
}

export function resolveSourceSegmentId(payload: ValidCompanyPayload): string {
  const key =
    payload.audience_source === AUDIENCE_SOURCE.CONNECTIONS
      ? payload.segment_name?.trim()
      : payload.computation_key?.trim()

  if (!key) {
    const message =
      payload.audience_source === AUDIENCE_SOURCE.CONNECTIONS
        ? 'The `Segment Name` field is required when Audience Source is "Connections".'
        : 'The `Audience Key` field is required to look up or create a LinkedIn DMP Company Segment.'
    throw new PayloadValidationError(message)
  }

  return key
}

async function getCompanyDmpSegmentId(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  payload: ValidCompanyPayload,
  statsContext: StatsContext | undefined,
  stateContext?: StateContext
): Promise<string> {
  const sourceSegmentId = resolveSourceSegmentId(payload)

  const cacheKey = `company_dmpsegment_id_${sourceSegmentId}`
  const cachedDmpSegmentId = stateContext?.getRequestContext?.(cacheKey)

  if (cachedDmpSegmentId) {
    statsContext?.statsClient?.incr('company_dmp_segment_cache_hit', 1, [...(statsContext?.tags ?? [])])
    return cachedDmpSegmentId
  }

  statsContext?.statsClient?.incr('company_dmp_segment_cache_miss', 1, [...(statsContext?.tags ?? [])])
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...(statsContext?.tags ?? []),
    'endpoint:get-company-dmpSegment'
  ])

  const res = await linkedinApiClient.getCompanyDmpSegment(settings, sourceSegmentId)
  if (res.status < 200 || res.status >= 300) {
    handleRequestError(res.status, statsContext)
  }

  const existing = (res.data?.elements ?? []).find((segment: DMPSegment) => segment.type === SEGMENT_TYPES.COMPANY)

  if (existing?.id) {
    const dmpSegmentId = `${existing.id}`
    stateContext?.setResponseContext?.(cacheKey, dmpSegmentId, { hour: 24 })
    return dmpSegmentId
  }

  const dmpSegmentId = await createCompanyDmpSegment(linkedinApiClient, settings, sourceSegmentId, statsContext)
  stateContext?.setResponseContext?.(cacheKey, dmpSegmentId, { hour: 24 })
  return dmpSegmentId
}

async function createCompanyDmpSegment(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  sourceSegmentId: string,
  statsContext: StatsContext | undefined
): Promise<string> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...(statsContext?.tags ?? []),
    'endpoint:create-company-dmpSegment'
  ])

  const res = await linkedinApiClient.createCompanyDmpSegment(settings, sourceSegmentId)
  if (res.status < 200 || res.status >= 300) {
    handleRequestError(res.status, statsContext)
  }

  // LinkedIn returns the new segment id in the x-restli-id response header, not the body.
  const id = res.headers?.get('x-restli-id') ?? ''
  if (!id) {
    throw new IntegrationError(
      'LinkedIn did not return an id for the newly created Company Audience.',
      'CREATE_SEGMENT_FAILURE',
      500
    )
  }
  return id
}
