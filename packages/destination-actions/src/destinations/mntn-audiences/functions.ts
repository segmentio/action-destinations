import { IntegrationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { MNTN_API_BASE } from './constants'
import { MNTN_API_VERSION } from './versioning-info'
import type { CreateAudienceInput, GetAudienceInput, SegmentResponse } from './types'

export async function testAuthentication(request: RequestClient) {
  return request(`${MNTN_API_BASE}/${MNTN_API_VERSION}/audience/segments?limit=1`, {
    method: 'GET'
  })
}

export async function createAudience(request: RequestClient, createAudienceInput: CreateAudienceInput) {
  const { audienceName, audienceSettings: { segment_id } = {} } = createAudienceInput

  if (segment_id) {
    return { externalId: segment_id }
  }

  if (!audienceName) {
    throw new PayloadValidationError(
      'Missing audience name. Provide an audience name or supply a pre-existing MNTN Segment ID in the audience settings.'
    )
  }

  const response = await request<SegmentResponse>(`${MNTN_API_BASE}/${MNTN_API_VERSION}/audience/segments`, {
    method: 'POST',
    json: {
      segment: {
        name: audienceName
      }
    }
  })

  const id = response.data?.segment?.id

  if (!id) {
    throw new IntegrationError(
      'MNTN returned an unexpected response when creating the audience segment. Please try again or contact MNTN support.',
      'INVALID_RESPONSE',
      500
    )
  }

  return { externalId: id }
}

export async function getAudience(request: RequestClient, getAudienceInput: GetAudienceInput) {
  const { externalId, audienceSettings: { segment_id } = {} } = getAudienceInput

  const segmentId = segment_id || externalId

  if (!segmentId) {
    throw new IntegrationError(
      'No MNTN Segment ID found. Ensure the destination was properly initialized, or provide a Segment ID in the audience settings.',
      'MISSING_SEGMENT_ID',
      400
    )
  }

  const response = await request<SegmentResponse>(
    `${MNTN_API_BASE}/${MNTN_API_VERSION}/audience/segments/${encodeURIComponent(segmentId)}`,
    { method: 'GET' }
  )

  const id = response.data?.segment?.id

  if (!id) {
    throw new IntegrationError(
      'MNTN returned an unexpected response when verifying the audience segment. Please try again or contact MNTN support.',
      'INVALID_RESPONSE',
      500
    )
  }

  return { externalId: id }
}
