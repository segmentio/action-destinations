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
  LINKEDIN_HOST,
  MAX_CITY_LENGTH,
  MAX_COMPANY_ID_LENGTH,
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

const SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i
const HTTP_SCHEME = /^https?:\/\//i
const TRAILING_DOT = /\.$/
const WWW_PREFIX = /^www\./
const TRAILING_SLASHES = /\/+$/
const QUERY_OR_FRAGMENT = /[?#]/
const ORGANIZATION_URN_PREFIXES = new RegExp(`^(?:${ORGANIZATION_URN_PREFIX})+`, 'i')
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

export function toOrganizationUrn(linkedInCompanyId?: string): string | undefined {
  const raw = trimmed(linkedInCompanyId)
  if (!raw || raw.length > MAX_COMPANY_ID_LENGTH) {
    return undefined
  }

  // One anchored pass, not a loop that re-copies the remainder each time round.
  const id = raw.replace(ORGANIZATION_URN_PREFIXES, '').trim()
  return id ? `${ORGANIZATION_URN_PREFIX}${id}` : undefined
}

function trimmed(value?: string): string | undefined {
  return value?.trim() || undefined
}

function withinLength(value: string | undefined, max: number): string | undefined {
  return value && value.length <= max ? value : undefined
}

function parseUrl(value?: string): URL | undefined {
  const raw = trimmed(value)?.toLowerCase()
  if (!raw) {
    return undefined
  }

  try {
    return new URL(SCHEME_PREFIX.test(raw) ? raw : `https://${raw}`)
  } catch {
    return undefined
  }
}

export function normalizeDomain(value?: string): string | undefined {
  const hostname = parseUrl(value)?.hostname
  if (!hostname) {
    return undefined
  }

  // To be fully qualified a domain must contain a dot.
  // An IPv4 address is full of dots, so it needs rejecting on its own.
  const host = hostname.replace(TRAILING_DOT, '')
  if (!host.includes('.') || IPV4.test(host)) {
    return undefined
  }

  // 'www.' is an alias for the domain itself, and LinkedIn's own sample request sends the domain
  // without it, so both spellings fold to one company rather than two request elements. Any other
  // subdomain is a different host and is kept, as is a 'www.' whose removal would leave a value
  // that is no longer fully qualified.
  const stripped = host.replace(WWW_PREFIX, '')
  return stripped.includes('.') ? stripped : host
}

function isLinkedInHost(hostname: string): boolean {
  return hostname === LINKEDIN_HOST || hostname.endsWith(`.${LINKEDIN_HOST}`)
}

export function normalizeCompanyPageUrl(value?: string): string | undefined {
  // Sent as the customer wrote it, minus the scheme, the query string and the fragment. No URL
  // parsing: the parser re-encodes a non-ascii slug, and the only thing worth checking here is
  // the host.
  const withoutScheme = trimmed(value)?.toLowerCase().replace(HTTP_SCHEME, '')
  const withoutQuery = withoutScheme?.split(QUERY_OR_FRAGMENT)[0]

  // Length is checked before the slashes are stripped, so the strip never runs on a long value.
  if (!withoutQuery || withoutQuery.length > MAX_COMPANY_PAGE_URL_LENGTH) {
    return undefined
  }

  const pageUrl = withoutQuery.replace(TRAILING_SLASHES, '')
  return isLinkedInHost(pageUrl.split('/')[0]) ? pageUrl : undefined
}

export function normalizeIndustries(values?: string[] | string): string[] | undefined {
  const list = typeof values === 'string' ? values.split(',') : values ?? []

  // An array entry can itself be comma delimited
  const parts = list.flatMap((industry) => industry.split(','))

  const cleaned = parts
    .map((industry) => industry.trim())
    .filter((industry) => industry && industry.length <= MAX_INDUSTRY_LENGTH)

  const seen = new Set<string>()
  const industries = cleaned
    .filter((industry) => {
      const key = industry.toLowerCase()
      const duplicate = seen.has(key)
      seen.add(key)
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

  const organizationUrn = toOrganizationUrn(identifiers?.linkedInCompanyId)
  const companyName = trimmed(identifiers?.companyName)
  const companyDomain = normalizeDomain(identifiers?.companyDomain)
  const companyEmailDomain = normalizeDomain(identifiers?.companyEmailDomain)
  const companyPageUrl = normalizeCompanyPageUrl(identifiers?.companyPageUrl)

  return {
    ...(companyName && { companyName }),
    ...(companyDomain && { companyDomain }),
    ...(companyEmailDomain && { companyEmailDomain }),
    ...(organizationUrn && { organizationUrn }),
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
      // Mapping a value that normalization then rejects looks identical to mapping nothing at
      // all, so say which of the two happened.
      message = Object.values(payload.identifiers ?? {}).some((identifier) => trimmed(identifier))
        ? `Every value in the 'Identifiers' field was rejected. Check each against the format it expects: a domain must be fully qualified, such as 'microsoft.com', a 'LinkedIn Company ID' must have an id after the URN prefix, and a 'LinkedIn Company Page URL' must be a page on linkedin.com of ${MAX_COMPANY_PAGE_URL_LENGTH} characters or fewer.`
        : "At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required in the 'Identifiers' field."
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
      validPayloads.push({
        ...payload,
        // Narrowed by the check above; the generated Payload type keeps `choices` as a string.
        dmp_company_action: payload.dmp_company_action as AudienceAction,
        identifiers,
        company_traits: normalizeTraits(payload),
        index
      })
    }
  })

  return validPayloads
}

// Every identifier we send belongs in the key. Two payloads that would produce different request
// elements must not collapse onto one another, or one of them is silently dropped. Traits are
// deliberately excluded, as is the 'Send Company Traits' toggle that enables them: the toggle is
// the customer's acknowledgement that only one company's traits are sent, which keeps this at one
// element per company.
export function companyKey(payload: ValidCompanyPayload): string {
  const { companyName, companyDomain, companyEmailDomain, organizationUrn, companyPageUrl } = payload.identifiers

  return JSON.stringify({
    action: payload.dmp_company_action,
    companyName,
    companyDomain,
    companyEmailDomain,
    organizationUrn,
    companyPageUrl
  })
}

export function buildJSON(payloads: ValidCompanyPayload[]): AudienceJSON<LinkedInCompanyAudienceElement> {
  const elements: LinkedInCompanyAudienceElement[] = payloads.map((payload) => {
    const { companyName, companyDomain, companyEmailDomain, organizationUrn, companyPageUrl } = payload.identifiers
    return {
      action: payload.dmp_company_action,
      ...(companyName && { companyName }),
      ...(companyDomain && { companyWebsiteDomain: companyDomain }),
      ...(companyEmailDomain && { companyEmailDomain }),
      ...(organizationUrn && { organizationUrn }),
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
