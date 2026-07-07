import {
  MultiStatusResponse,
  PayloadValidationError,
  RetryableError,
  InvalidAuthenticationError,
  APIError,
  JSONLikeObject,
  RequestClient,
  StatsContext
} from '@segment/actions-core'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import type { AudienceJSON, LinkedInCompanyAudienceElement, ValidCompanyPayload, HookOutputs } from './types'
import { AUDIENCE_ACTION, ORGANIZATION_URN_PREFIX, RETRYABLE_STATUSES } from './constants'

export function toOrganizationUrn(linkedInCompanyId: string): string {
  return linkedInCompanyId.startsWith(ORGANIZATION_URN_PREFIX)
    ? linkedInCompanyId
    : `${ORGANIZATION_URN_PREFIX}${linkedInCompanyId}`
}

export function validate(
  payloads: Payload[],
  msResponse: MultiStatusResponse,
  isBatch: boolean
): ValidCompanyPayload[] {
  const validPayloads: ValidCompanyPayload[] = []

  payloads.forEach((payload, index) => {
    const { companyDomain, linkedInCompanyId } = payload.identifiers ?? {}
    if (!companyDomain && !linkedInCompanyId) {
      const message =
        "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field."
      if (isBatch) {
        msResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: message,
          sent: payload as unknown as JSONLikeObject,
          body: {}
        })
      } else {
        throw new PayloadValidationError(message)
      }
    } else {
      validPayloads.push({ ...payload, index })
    }
  })

  return validPayloads
}

export function companyKey(payload: ValidCompanyPayload): string {
  const { companyDomain, linkedInCompanyId } = payload.identifiers ?? {}
  const domainTrimmed = companyDomain ? companyDomain.trim().toLowerCase() : ''
  const domain = domainTrimmed ? domainTrimmed : ''
  const linkedinCompanyIdTrimmed = linkedInCompanyId ? linkedInCompanyId.trim() : ''
  const urn = linkedinCompanyIdTrimmed ? toOrganizationUrn(linkedinCompanyIdTrimmed) : ''
  const action = payload.action === AUDIENCE_ACTION.REMOVE ? AUDIENCE_ACTION.REMOVE : AUDIENCE_ACTION.ADD
  return `${action}::${domain}::${urn}`
}

export function buildJSON(payloads: ValidCompanyPayload[]): AudienceJSON<LinkedInCompanyAudienceElement> {
  const elements: LinkedInCompanyAudienceElement[] = payloads.map((payload) => {
    const { companyDomain, linkedInCompanyId } = payload.identifiers ?? {}
    const element: LinkedInCompanyAudienceElement = {
      action: payload.action === AUDIENCE_ACTION.REMOVE ? AUDIENCE_ACTION.REMOVE : AUDIENCE_ACTION.ADD
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
  payloads: Payload[],
  hookOutputs: HookOutputs | undefined,
  isBatch: boolean,
  statsContext: StatsContext | undefined
) {
  const segmentId = hookOutputs?.retlOnMappingSave?.outputs?.id ?? hookOutputs?.onMappingSave?.outputs?.id
  if (!segmentId) {
    throw new PayloadValidationError(
      'No LinkedIn Company Audience is connected to this mapping. Please re-save the mapping to create or select a Company Audience.'
    )
  }

  const msResponse = new MultiStatusResponse()
  const validPayloads = validate(payloads, msResponse, isBatch)

  if (validPayloads.length === 0) {
    if (isBatch) {
      return msResponse
    }
    throw new PayloadValidationError('No valid payloads to process after validation.')
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
  const linkedinApiClient = new LinkedInAudiences(request)

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...(statsContext?.tags ?? []),
    'endpoint:add-or-remove-companies-from-dmpSegment'
  ])

  const response = await linkedinApiClient.batchUpdateCompanies(segmentId, json)

  if (response.status !== 200) {
    handleRequestError(response.status, statsContext)
  }

  if (!isBatch) {
    return response
  }

  const resultElements = response.data?.elements ?? []
  uniquePayloads.forEach((payload, i) => {
    const result = resultElements[i]
    const sent = json.elements[i] as unknown as JSONLikeObject
    payloadIndexes[i].forEach((index) => {
      if (result && result.status >= 200 && result.status < 300) {
        msResponse.setSuccessResponseAtIndex(index, {
          status: result.status,
          sent,
          body: payload as unknown as JSONLikeObject
        })
      } else {
        msResponse.setErrorResponseAtIndex(index, {
          status: result?.status ?? 400,
          errortype: 'BAD_REQUEST',
          errormessage: result?.error?.message || 'LinkedIn did not return a result for this company.',
          sent,
          body: payload as unknown as JSONLikeObject
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

  if (RETRYABLE_STATUSES.includes(status)) {
    throw new RetryableError(
      'Transient error while updating the LinkedIn DMP Company Segment. This batch will be retried.',
      status as 408 | 423 | 429 | 500 | 502 | 503 | 504
    )
  }

  throw new APIError(`Failed to update LinkedIn DMP Company Segment. LinkedIn returned status ${status}.`, status)
}
