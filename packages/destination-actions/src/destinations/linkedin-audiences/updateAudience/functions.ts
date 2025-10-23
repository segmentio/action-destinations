import { MultiStatusResponse, IntegrationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { AudienceJSON,LinkedInUserAudienceElement, AudienceAction, LinkedInUserId, ValidUserPayload} from '../types'
import { AUDIENCE_ACTION } from '../constants'
import type { Settings } from '../generated-types'
import { processHashing } from '../../../lib/hashing-utils'

export function validate(payloads: Payload[], msResponse: MultiStatusResponse, isBatch: boolean, settings: Settings): ValidUserPayload[] {
  const { send_google_advertising_id, send_email } = settings
  const validPayloads: ValidUserPayload[] = []

  if (!send_google_advertising_id && !send_email) {
    if(isBatch){
      payloads.forEach((_, index) => {
        msResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: "At least one of 'Send Email' or 'Send Google Advertising ID' setting fields must be set to 'true'."
        })
      })
      return validPayloads
    }
    else {
      throw new IntegrationError(
        "At least one of 'Send Email' or 'Send Google Advertising ID' setting fields must be set to 'true'.",
        'BAD_REQUEST',
        400
      )
    }
  }

  payloads.forEach((p, index) => {
    const hasEmail = !!p.email
    const hasGAID = !!p.google_advertising_id
    const includeEmail = send_email && hasEmail
    const includeGAID = send_google_advertising_id && hasGAID
    const hasId = includeEmail || includeGAID

    if(!hasId){
      // Must have at least one identifier  
      msResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "At least one of 'User Email' or 'User Google Advertising ID' fields are required. Make sure to enable the 'Send Email' and / or 'Send Google Advertising ID' setting so that the corresponding identifiers are included."
      })
    } 
    else {
      validPayloads.push({ ...p, index})
    }
  })

  return validPayloads
}

export function buildJSON(payloads: Payload[], settings: Settings): AudienceJSON<LinkedInUserAudienceElement> {

  function getAction(payload: Payload): AudienceAction {
    const { dmp_user_action = 'AUTO' } = payload

    if (dmp_user_action === AUDIENCE_ACTION.ADD) {
      return AUDIENCE_ACTION.ADD
    }

    if (dmp_user_action === AUDIENCE_ACTION.REMOVE) {
      return AUDIENCE_ACTION.REMOVE
    }

    if (dmp_user_action === 'AUTO' || !dmp_user_action) {
      if (payload.event_name === 'Audience Entered') {
        return AUDIENCE_ACTION.ADD
      }

      if (payload.event_name === 'Audience Exited') {
        return AUDIENCE_ACTION.REMOVE
      }
    }

    return AUDIENCE_ACTION.ADD
  }

  function getUserIds(settings: Settings, payload: Payload): LinkedInUserId[] {
    const userIds: LinkedInUserId[] = []

    if (payload.email && settings.send_email === true) {
      userIds.push({
        idType: 'SHA256_EMAIL',
        idValue: processHashing(payload.email, 'sha256', 'hex')
      })
    }

    if (payload.google_advertising_id && settings.send_google_advertising_id === true) {
      userIds.push({
        idType: 'GOOGLE_AID',
        idValue: payload.google_advertising_id
      })
    }

    return userIds
  }

  const elements: LinkedInUserAudienceElement[] = []

  payloads.forEach((payload: Payload) => {
    const { first_name, last_name, title, company, country } = payload
    elements.push({
      action: getAction(payload),
      userIds: getUserIds(settings, payload),
      ...(first_name ? { firstName: first_name } : {}),
      ...(last_name ? { lastName: last_name } : {}),
      ...(title ? { title } : {}),
      ...(company ? { company } : {}),
      ...(country ? { country } : {})
    })
  })
  return { elements }
}

export function getSegmentSourceIdAndName(payload: Payload): {sourceSegmentId: string, segmentName: string} {
   const { personas_audience_key: sourceSegmentId, dmp_segment_name: segmentName } = payload
   return {sourceSegmentId, segmentName: segmentName || sourceSegmentId}
}
