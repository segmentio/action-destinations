import {StatsContext, MultiStatusResponse, RequestClient, RetryableError, PayloadValidationError  } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import { LinkedInAudiencePayload, SegmentType } from '../types'
import { PayloadWithIndex } from './types'
import { processHashing } from '../../../lib/hashing-utils'
import { SEGMENT_TYPES } from '../constants'

export async function send(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  statsContext: StatsContext | undefined
) {
  const msResponse = new MultiStatusResponse()
  
  const indexedPayloads = payloads.map((payload, index) => ({ ...payload, index }))
  
  validate(indexedPayloads, msResponse)

  const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)

  const dmpSegmentId = await getDmpSegmentId(linkedinApiClient, settings, payloads[0], SEGMENT_TYPES.COMPANY, statsContext)
  const elements = extractUsers(settings, payloads)

  // We should never hit this condition because at least an email or a
  // google ad id is required in each payload, but if we do, returning early
  // rather than hitting LinkedIn's API (with no data) is more efficient.
  // The monoservice will interpret this early return as a 200.
  // If we were to send an empty elements array to LINKEDIN_API_VERSION,
  // their API would also respond with status 200.
  if (elements.length < 1) {
    return
  }

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...statsContext?.tags,
    `endpoint:add-or-remove-users-from-dmpSegment`
  ])

  const res = await linkedinApiClient.batchUpdate(dmpSegmentId, elements)

  // At this point, if LinkedIn's API returns a 404 error, it's because the audience
  // Segment just created isn't available yet for updates via this endpoint.
  // Audiences are usually available to accept batches of data 1 - 2 minutes after
  // they're created. Here, we'll throw an error and let Centrifuge handle the retry.
  if (res.status !== 200) {
    throw new RetryableError('Error while attempting to update LinkedIn DMP Segment. This batch will be retried.')
  }

  return res
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

async function getDmpSegmentId(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  payload: Payload,
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
): Promise<string> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:get-dmpSegment`])

  const { computation_key } = payload

  const response = await linkedinApiClient.getDmpSegment(settings, computation_key)
  
  const { id, type } = response.data?.elements?.[0]
  
  if(typeof type === 'string' && type !== segmentType){
    throw new PayloadValidationError(
      `The existing DMP Segment with Source Segment Id ${computation_key} is of type ${type} and cannot be used to update a segment of type ${segmentType}.`
    )
  }

  if (id) {
    return id
  }

  return createDmpSegment(linkedinApiClient, settings, payload, segmentType, statsContext)
}

async function createDmpSegment(
  linkedinApiClient: LinkedInAudiences,
  settings: Settings,
  payload: Payload,
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
): Promise<string> {
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:create-dmpSegment`])
  const { computation_key } = payload
  const res = await linkedinApiClient.createDmpSegment(settings, computation_key, segmentType)
  const headers = res.headers.toJSON()
  return headers['x-linkedin-id']
}

function extractUsers(settings: Settings, payloads: Payload[]): LinkedInAudiencePayload[] {
  const elements: LinkedInAudiencePayload[] = []

  payloads.forEach((payload: Payload) => {
    if (!payload.email && !payload.google_advertising_id) {
      return
    }

    const linkedinAudiencePayload: LinkedInAudiencePayload = {
      action: getAction(payload),
      userIds: getUserIds(settings, payload)
    }

    if (payload.first_name) {
      linkedinAudiencePayload.firstName = payload.first_name
    }

    if (payload.last_name) {
      linkedinAudiencePayload.lastName = payload.last_name
    }

    if (payload.title) {
      linkedinAudiencePayload.title = payload.title
    }

    if (payload.company) {
      linkedinAudiencePayload.company = payload.company
    }

    if (payload.country) {
      linkedinAudiencePayload.country = payload.country
    }

    elements.push(linkedinAudiencePayload)
  })

  return elements
}

function getAction(payload: Payload): 'ADD' | 'REMOVE' {
  const { dmp_user_action = 'AUTO' } = payload

  if (dmp_user_action === 'ADD') {
    return 'ADD'
  }

  if (dmp_user_action === 'REMOVE') {
    return 'REMOVE'
  }

  if (dmp_user_action === 'AUTO' || !dmp_user_action) {
    if (payload.event_name === 'Audience Entered') {
      return 'ADD'
    }

    if (payload.event_name === 'Audience Exited') {
      return 'REMOVE'
    }
  }

  return 'ADD'
}

function getUserIds(settings: Settings, payload: Payload): Record<string, string>[] {
  const userIds = []

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