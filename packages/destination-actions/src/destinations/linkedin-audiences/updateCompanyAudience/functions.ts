import { MultiStatusResponse, PayloadValidationError } from '@segment/actions-core'
import type { Payload} from './generated-types'
import type { AudienceJSON, LinkedInCompanyAudienceElement, AudienceAction, ValidCompanyPayload } from '../types'
import { AUDIENCE_ACTION } from '../constants'

export function validate(payloads: Payload[], msResponse: MultiStatusResponse, isBatch: boolean): ValidCompanyPayload[] {
  const validPayloads: ValidCompanyPayload[] = []
  payloads.forEach((p, index) => {
    const { identifiers: { companyDomain, linkedInCompanyId } } = p
    if (!companyDomain && !linkedInCompanyId) {
      if(isBatch){
        msResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: "At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field."
        })
      }
      else {
        throw new PayloadValidationError("At least one of 'Company Domain' or 'LinkedIn Company ID' is required in the 'Identifiers' field.")
      }
    } else {
      validPayloads.push({ ...p, index})
    }
  })

  return validPayloads
}

export function buildJSON(payloads: Payload[]): AudienceJSON<LinkedInCompanyAudienceElement> {
  const elements: LinkedInCompanyAudienceElement[] = []

  payloads.forEach((payload) => {
    const action: AudienceAction = payload.action === 'AUTO' ? payload.traits_or_props[payload.computation_key] === true ? AUDIENCE_ACTION.ADD : AUDIENCE_ACTION.REMOVE : payload.action === AUDIENCE_ACTION.ADD ? AUDIENCE_ACTION.ADD : AUDIENCE_ACTION.REMOVE
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

export function getSegmentSourceIdAndName(payload: Payload): {sourceSegmentId: string, segmentName: string} {
   const { computation_key: sourceSegmentId, segment_creation_name: segmentName } = payload
   return {sourceSegmentId, segmentName}
}