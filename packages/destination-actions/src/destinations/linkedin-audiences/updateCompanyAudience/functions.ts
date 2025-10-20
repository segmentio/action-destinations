import {StatsContext, MultiStatusResponse, RequestClient, RetryableError, PayloadValidationError  } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import { SegmentType } from '../types'
import type { PayloadWithIndex, LinkedInCompanyAudienceJSON } from './types'
import { SEGMENT_TYPES } from '../constants'
import { SEGMENT_TYPE } from 'src/destinations/the-trade-desk-crm'

export async function send(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
) {
  const msResponse = new MultiStatusResponse()
  
  const indexedPayloads = payloads.map((payload, index) => ({ ...payload, index }))
  
  validate(indexedPayloads, msResponse)

  const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)

  const { computation_key } = indexedPayloads[0]

  const { id, type } = await getDmpSegmentIdAndType(linkedinApiClient, settings, computation_key, SEGMENT_TYPES.COMPANY, statsContext)

  if(!id || !type || type !== segmentType) {
    if(segmentType === SEGMENT_TYPES.COMPANY){
      indexedPayloads.forEach((payload: PayloadWithIndex) => {
        msResponse.setErrorResponseAtIndex(payload.index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: `The existing DMP Segment with Source Segment Id ${computation_key} is of type ${type} and cannot be used to update a segment of type ${segmentType}.`
        })
      })
    } 
    else {
      throw new PayloadValidationError(`The existing DMP Segment with Source Segment Id ${computation_key} is of type ${type} and cannot be used to update a segment of type ${segmentType}.`)
    }
  }
  
  const json = buildJSON(indexedPayloads)

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...statsContext?.tags,
    `endpoint:add-or-remove-users-from-abm-dmpSegment`
  ])

  const response = await linkedinApiClient.batchUpdate(id, json, SEGMENT_TYPES.COMPANY)

  
  
}

function validate(payloads: PayloadWithIndex[], msResponse: MultiStatusResponse): void {
  payloads.forEach((payload: PayloadWithIndex) => {
    const { identifiers: { companyDomain, linkedInCompanyId }, index } = payload
    if (!companyDomain && !linkedInCompanyId) {
      msResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field."
      })
    }
  })
}

async function getDmpSegmentIdAndType(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  computationKey: string,
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
): Promise<{ id: string; type: SegmentType }> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:get-${segmentType === SEGMENT_TYPES.COMPANY ? 'abm-' : ''}dmpSegment`])

  const response = await linkedinApiClient.getDmpSegment(settings, computationKey)
  
  const { id, type } = response.data?.elements?.[0]
  
  if (id && type) {
    return { id, type }
  }

  return createDmpSegment(linkedinApiClient, settings, computationKey, segmentType, statsContext)
}

async function createDmpSegment(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  computationKey: string,
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
): Promise<{ id: string; type: SegmentType }> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:create-dmpSegment`])
  const res = await linkedinApiClient.createDmpSegment(settings, computationKey, segmentType)
  const { id, type } = res.data
  return { id, type }
}

function buildJSON(payloads: PayloadWithIndex[]): LinkedInCompanyAudienceJSON {
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