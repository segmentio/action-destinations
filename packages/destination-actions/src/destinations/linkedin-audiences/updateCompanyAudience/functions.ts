import {
  MultiStatusResponse,
  PayloadValidationError,
  RetryableError,
  JSONLikeObject,
  RequestClient,
  StatsContext
} from '@segment/actions-core'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import type { AudienceJSON, LinkedInCompanyAudienceElement, ValidCompanyPayload, HookOutputs } from './types'
import { AUDIENCE_ACTION, ORGANIZATION_URN_PREFIX } from './constants'

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

  const json = buildJSON(validPayloads)
  const linkedinApiClient = new LinkedInAudiences(request)

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...(statsContext?.tags ?? []),
    'endpoint:add-or-remove-companies-from-dmpSegment'
  ])

  const response = await linkedinApiClient.batchUpdateCompanies(segmentId, json)

  if (response.status < 200 || response.status >= 300) {
    throw new RetryableError(
      'Error while attempting to update LinkedIn DMP Company Segment. This batch will be retried.'
    )
  }

  if (!isBatch) {
    return response
  }

  const resultElements = response.data?.elements ?? []
  validPayloads.forEach((payload, i) => {
    const result = resultElements[i]
    const status = result?.status ?? 500
    if (status >= 200 && status < 300) {
      msResponse.setSuccessResponseAtIndex(payload.index, {
        status,
        sent: payload as unknown as JSONLikeObject,
        body: { elements: [json.elements[i]] } as unknown as JSONLikeObject
      })
    } else {
      msResponse.setErrorResponseAtIndex(payload.index, {
        status,
        errortype: 'BAD_REQUEST',
        errormessage: result?.error?.message || 'Failed to update LinkedIn Company Audience',
        sent: payload as unknown as JSONLikeObject,
        body: { elements: [json.elements[i]] } as unknown as JSONLikeObject
      })
    }
  })

  return msResponse
}
