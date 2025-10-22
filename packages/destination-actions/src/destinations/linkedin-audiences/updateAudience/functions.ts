import { StatsContext, RequestClient, RetryableError, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LinkedInAudiences } from '../api'
import { SegmentType, AudienceAction } from '../types'
import { LinkedInUserAudienceJSON, LinkedInUserId} from './types'
import { processHashing } from '../../../lib/hashing-utils'
import { AUDIENCE_ACTION } from '../constants'

export async function send(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  segmentType: SegmentType,
  statsContext: StatsContext | undefined
) {
  const { personas_audience_key: sourceSegmentId, dmp_segment_name: segmentName } = payloads[0]
  const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)
  const { id, type } = await getDmpSegmentIdAndType(linkedinApiClient, settings, sourceSegmentId, segmentName || sourceSegmentId, segmentType, statsContext)
  
  if(type !== segmentType) {
    throw new PayloadValidationError(`The existing DMP Segment with Source Segment Id ${sourceSegmentId} is of type ${type} and cannot be used to update a segment of type ${segmentType}.`)
  }

  const validPayloads = validate(settings, payloads)

  if(validPayloads.length === 0) {
    throw new PayloadValidationError('No valid payloads to process after validation.')  
  }

  const json = buildJSON(settings, validPayloads)

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...statsContext?.tags,
    `endpoint:add-or-remove-users-from-dmpSegment`
  ])

  const response = await linkedinApiClient.batchUpdate(id, json, segmentType)

  // At this point, if LinkedIn's API returns a 404 error, it's because the audience
  // Segment just created isn't available yet for updates via this endpoint.
  // Audiences are usually available to accept batches of data 1 - 2 minutes after
  // they're created. Here, we'll throw an error and let Centrifuge handle the retry.
  if (response.status !== 200) {
    throw new RetryableError('Error while attempting to update LinkedIn DMP Segment. This batch will be retried.')
  }

  return response
}

function validate(settings: Settings, payloads: Payload[]): Payload[] {
  const isAutoOrUndefined = ['AUTO', undefined].includes(payloads[0]?.dmp_user_action)
  const { send_google_advertising_id, send_email } = settings

  if (isAutoOrUndefined && payloads[0].source_segment_id !== payloads[0].personas_audience_key) {
    throw new IntegrationError(
      'The value of `source_segment_id` and `personas_audience_key` must match.',
      'INVALID_SETTINGS',
      400
    )
  }

  if (!send_google_advertising_id && !send_email) {
    throw new IntegrationError(
      'At least one of `Send Email` or `Send Google Advertising ID` must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }

  const validPayloads = payloads.filter((payload: Payload) => {
    const hasEmail = !!payload.email
    const hasGAID = !!payload.google_advertising_id

    // Must have at least one identifier
    if (!hasEmail && !hasGAID) return false

    // Include based on the flags
    const includeEmail = send_email && hasEmail
    const includeGAID = send_google_advertising_id && hasGAID

    // Must have at least one *included* identifier
    return includeEmail || includeGAID
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
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:get-dmpSegment`])
  const res = await linkedinApiClient.getDmpSegment(settings, sourceSegmentId)
  const body = await res.json()

  if (body.elements?.length > 0) {
    return body.elements[0].id
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

function buildJSON(settings: Settings, payloads: Payload[]): LinkedInUserAudienceJSON {

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

  const elements: LinkedInUserAudienceJSON['elements'] = []

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