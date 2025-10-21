import {StatsContext, MultiStatusResponse, RequestClient, PayloadValidationError, JSONLikeObject  } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import { SegmentType } from '../types'
import type { ValidPayload, LinkedInCompanyAudienceJSON } from './types'
import { SEGMENT_TYPES } from '../constants'

export async function send(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
) {
  const msResponse = new MultiStatusResponse()
  const { computation_key: sourceSegmentId, segment_creation_name: segmentName } = payloads[0]
  const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)
  const { id, type } = await getDmpSegmentIdAndType(linkedinApiClient, settings, sourceSegmentId, segmentName, SEGMENT_TYPES.COMPANY, statsContext)

  if(type !== segmentType) {
    // reject all payloads if Segment Type mismatches
    if(segmentType === SEGMENT_TYPES.COMPANY){
      payloads.forEach((_, index) => {
        msResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: `The existing DMP Segment with Source Segment Id ${sourceSegmentId} is of type ${type} and cannot be used to update a segment of type ${segmentType}.`
        })
      })
      return msResponse
    } 
    else {
      throw new PayloadValidationError(`The existing DMP Segment with Source Segment Id ${sourceSegmentId} is of type ${type} and cannot be used to update a segment of type ${segmentType}.`)
    }
  }
  
  const validPayloads = validate(payloads, msResponse)

  const json = buildJSON(validPayloads)

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...statsContext?.tags,
    `endpoint:add-or-remove-users-from-${segmentType === SEGMENT_TYPES.COMPANY ? 'abm-' : ''}dmpSegment`
  ])

  const response = await linkedinApiClient.batchUpdate(id, json, SEGMENT_TYPES.COMPANY)

  if(segmentType === SEGMENT_TYPES.USER) {
    return response
  } 

  const sentElements = json.elements

  validPayloads.forEach((payload: ValidPayload, index) => {
    const e = response.data.elements[index]
    if(e.status >= 200 && e.status < 300) {
      msResponse.setSuccessResponseAtIndex(payload.index, {
        status: e.status,
        sent: payload as unknown as JSONLikeObject,
        body: sentElements[index]
      })
    } 
    else {
      msResponse.setErrorResponseAtIndex(payload.index, {
        status: e.status,
        errortype: 'BAD_REQUEST',
        errormessage: e.message || 'Failed to update LinkedIn Audience',
        sent: payload as unknown as JSONLikeObject,
        body: sentElements[index] 
      })
    }
  })
}

function validate(payloads: Payload[], msResponse: MultiStatusResponse): ValidPayload[] {
  const validPayloads: ValidPayload[] = []
  
  payloads.forEach((p, index) => {
    const { identifiers: { companyDomain, linkedInCompanyId } } = p
    if (!companyDomain && !linkedInCompanyId) {
      msResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field."
      })
      validPayloads.push({ ...p, isError: true, index})
    } else {
      validPayloads.push({ ...p, isError: false, index})
    }
  })

  return validPayloads
}

async function getDmpSegmentIdAndType(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  sourceSegmentId: string,
  segmentName: string,
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
): Promise<{ id: string; type: SegmentType }> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:get-${segmentType === SEGMENT_TYPES.COMPANY ? 'abm-' : ''}dmpSegment`])

  const response = await linkedinApiClient.getDmpSegment(settings, sourceSegmentId)
  
  const { id, type } = response.data?.elements?.[0]
  
  if (id && type) {
    return { id, type }
  }

  return createDmpSegment(linkedinApiClient, settings, sourceSegmentId, segmentName, segmentType, statsContext)
}

async function createDmpSegment(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  sourceSegmentId: string,
  segmentName: string,
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
): Promise<{ id: string; type: SegmentType }> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:create-dmpSegment`])
  const res = await linkedinApiClient.createDmpSegment(settings, sourceSegmentId, segmentName, segmentType)
  const { id, type } = res.data
  return { id, type }
}

function buildJSON(payloads: ValidPayload[]): LinkedInCompanyAudienceJSON {
  const elements: LinkedInCompanyAudienceJSON['elements'] = []

  payloads.forEach((payload) => {
    const action = payload.action === 'AUTO' ? payload.props[payload.computation_key] === true ? 'ADD' : 'REMOVE' : payload.action === 'ADD' ? 'ADD' : 'REMOVE'
    
    const { companyDomain, linkedInCompanyId } = payload.identifiers
    
    const companyIds = [
      ...(companyDomain ? [{ idType: 'DOMAIN' as const, idValue: companyDomain }] : []),
      ...(linkedInCompanyId ? [{ idType: 'LINKEDIN_COMPANY_ID' as const, idValue: linkedInCompanyId }] : [])
    ]

    elements.push({
      action,
      companyIds
    })
  })

  return { elements }
}