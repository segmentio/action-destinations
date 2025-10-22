import {StatsContext, MultiStatusResponse, RequestClient, PayloadValidationError, JSONLikeObject, RetryableError  } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { LinkedInAudiences } from './api'
import { SegmentType, AudienceJSON } from './types'
import { SEGMENT_TYPES } from './constants'

export async function send<P, E>(
  request: RequestClient,
  getSegmentSourceIdAndName: (payload: P) => { sourceSegmentId: string; segmentName: string },
  buildJSON: (payloads: P[], settings: Settings) => AudienceJSON<E>,
  validate: (payloads: P[], msResponse: MultiStatusResponse, isBatch: boolean, settings: Settings) => (P & { index: number })[],
  settings: Settings,
  payloads: P[],
  segmentType: SegmentType,
  isBatch: boolean,
  statsContext: StatsContext | undefined
) {
  const msResponse = new MultiStatusResponse()
  const { sourceSegmentId, segmentName } = getSegmentSourceIdAndName(payloads[0])
  const linkedinApiClient: LinkedInAudiences = new LinkedInAudiences(request)
  const { id, type } = await getDmpSegmentIdAndType(linkedinApiClient, settings, sourceSegmentId, segmentName, segmentType, statsContext)

  if(type !== segmentType) {
    // reject all payloads if Segment Type mismatches
    if(isBatch){
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
      console.log('------------------HERE------------------')
      throw new PayloadValidationError(`The existing DMP Segment with Source Segment Id ${sourceSegmentId} is of type ${type} and cannot be used to update a segment of type ${segmentType}.`)
    }
  }

  const validPayloads = validate(payloads, msResponse, isBatch, settings)

  if(validPayloads.length === 0) {
    if(isBatch){
      return msResponse
    } 
    else {
      throw new PayloadValidationError('No valid payloads to process after validation.')
    }
  }

  const json = buildJSON(validPayloads, settings)

  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [
    ...statsContext?.tags,
    `endpoint:add-or-remove-users-from-${segmentType === SEGMENT_TYPES.COMPANY ? 'abm-' : ''}dmpSegment`
  ])

  const response = await linkedinApiClient.batchUpdate(id, json, segmentType)

  // At this point, if LinkedIn's API returns a 404 error, it's because the audience
  // Segment just created isn't available yet for updates via this endpoint.
  // Audiences are usually available to accept batches of data 1 - 2 minutes after
  // they're created. Here, we'll throw an error and let Centrifuge handle the retry.
  if (response.status !== 200) {
    throw new RetryableError('Error while attempting to update LinkedIn DMP Segment. This batch will be retried.')
  }

  if(isBatch) {
    const sentElements = json.elements

    validPayloads.forEach((payload, index) => {
      const e = response.data.elements[index]
      if(e.status >= 200 && e.status < 300) {
        msResponse.setSuccessResponseAtIndex(payload.index, {
          status: e.status,
          sent: payload as JSONLikeObject,
          body: sentElements[index] as JSONLikeObject
        })
      } 
      else {
        msResponse.setErrorResponseAtIndex(payload.index, {
          status: e.status,
          errortype: 'BAD_REQUEST',
          errormessage: e.message || 'Failed to update LinkedIn Audience',
          sent: payload as JSONLikeObject,
          body: sentElements[index] as JSONLikeObject
        })
      }
    })
    return msResponse
  } 
  else {
    return response
  }
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
  const { id, type } = response.data?.elements?.[0] || {}
  console.log('id =', id, 'type =', type)
  
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
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:create-${segmentType === SEGMENT_TYPES.COMPANY ? 'abm-' : ''}dmpSegment`])
  
  console.log('calling linkedinApiClient.createDmpSegment with.', sourceSegmentId, segmentName, segmentType )
  const res = await linkedinApiClient.createDmpSegment(settings, sourceSegmentId, segmentName, segmentType)
  
  const { id, type } = res.data

  console.log('id =', id, 'type =', type)
  return { id, type }
}