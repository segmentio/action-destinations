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
import type { AudienceJSON, DMPSegment, LinkedInCompanyAudienceElement, ValidCompanyPayload } from './types'
import { AUDIENCE_ACTION, AUDIENCE_SOURCE, ORGANIZATION_URN_PREFIX, RETRYABLE_STATUSES, SEGMENT_TYPES } from './constants'

export function toOrganizationUrn(linkedInCompanyId: string): string {
  if (linkedInCompanyId.toLowerCase().startsWith(ORGANIZATION_URN_PREFIX)) {
    return `${ORGANIZATION_URN_PREFIX}${linkedInCompanyId.slice(ORGANIZATION_URN_PREFIX.length)}`
  }
  return `${ORGANIZATION_URN_PREFIX}${linkedInCompanyId}`
}

export function validate(
  payloads: Payload[],
  msResponse: MultiStatusResponse,
  isBatch: boolean
): ValidCompanyPayload[] {
  const validPayloads: ValidCompanyPayload[] = []

  payloads.forEach((payload, index) => {
    const companyDomain = payload.identifiers?.companyDomain?.trim().toLowerCase() || undefined
    const linkedInCompanyId = payload.identifiers?.linkedInCompanyId?.trim() || undefined
    if (!companyDomain && !linkedInCompanyId) {
      const message =
        "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field."
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
      validPayloads.push({ ...payload, identifiers: { companyDomain, linkedInCompanyId }, index })
    }
  })

  return validPayloads
}

export function companyKey(payload: ValidCompanyPayload): string {
  const { companyDomain, linkedInCompanyId } = payload.identifiers ?? {}
  const domain = companyDomain ?? ''
  const urn = linkedInCompanyId ? toOrganizationUrn(linkedInCompanyId) : ''
  const action =
    payload.dmp_company_action === AUDIENCE_ACTION.REMOVE ? AUDIENCE_ACTION.REMOVE : AUDIENCE_ACTION.ADD
  return `${action}::${domain}::${urn}`
}

export function buildJSON(payloads: ValidCompanyPayload[]): AudienceJSON<LinkedInCompanyAudienceElement> {
  const elements: LinkedInCompanyAudienceElement[] = payloads.map((payload) => {
    const { companyDomain, linkedInCompanyId } = payload.identifiers ?? {}
    const element: LinkedInCompanyAudienceElement = {
      action:
        payload.dmp_company_action === AUDIENCE_ACTION.REMOVE ? AUDIENCE_ACTION.REMOVE : AUDIENCE_ACTION.ADD
    }
    if (companyDomain) {
      element.companyWebsiteDomain = companyDomain
    }
    if (linkedInCompanyId) {
      element.organizationUrn = toOrganizationUrn(linkedInCompanyId)
    }
    return element
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

  let segmentId: string
  try {
    segmentId = await getCompanyDmpSegmentId(linkedinApiClient, settings, validPayloads[0], statsContext, stateContext)
  } catch (err) {
    if (err instanceof RetryableError || err instanceof InvalidAuthenticationError || !isBatch) {
      throw err
    }
    const { status, message } = err as IntegrationError
    validPayloads.forEach((payload) => {
      msResponse.setErrorResponseAtIndex(payload.index, {
        status: status ?? 400,
        errortype: 'BAD_REQUEST',
        errormessage: message
      })
    })
    return msResponse
  }

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
      handleRequestError(element?.status ?? 400, statsContext)
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

function handleRequestError(status: number, statsContext: StatsContext | undefined): never {
  statsContext?.statsClient?.incr('linkedin_dmp_company_segment_update_error', 1, [
    ...(statsContext?.tags ?? []),
    `status_code:${status}`
  ])

  if (status === 401) {
    throw new InvalidAuthenticationError(
      'Invalid LinkedIn OAuth access token. New authentication token will be requested.'
    )
  }

  if (status === 409) {
    throw new RetryableError(
      'Conflict while updating the LinkedIn DMP Company Segment. This batch will be retried.',
      429
    )
  }

  if (RETRYABLE_STATUSES.includes(status)) {
    throw new RetryableError(
      'Transient error while updating the LinkedIn DMP Company Segment. This batch will be retried.',
      status as 408 | 423 | 429 | 500 | 502 | 503 | 504
    )
  }

  throw new APIError(`Failed to update LinkedIn DMP Company Segment. LinkedIn returned status ${status}.`, status)
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
  stateContext?.setResponseContext?.(cacheKey, dmpSegmentId, {})
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
