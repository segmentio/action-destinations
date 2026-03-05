import { RequestClient, IntegrationError } from '@segment/actions-core'
import { CONSTANTS } from './constants'
import type { CreateSegmentJSON, CreateSegmentResponse, GetSegmentResponse } from './types'

export async function createSegment(request: RequestClient, name: string): Promise<string> {
  const json: CreateSegmentJSON = { 
    name, 
    visitors: ["empty-visitor"] // Pendo requires at least one visitor to create a segment, but it can be an empty placeholder since we'll be updating the segment with the actual visitors in the syncAudience function
  }
  const response = await request<CreateSegmentResponse>(
    `${CONSTANTS.API_BASE_URL}${CONSTANTS.SEGMENT_ENDPOINT}/upload`,
    {
      method: 'POST',
      json
    }
  )

  return response.data.segmentId
}

export async function getSegment(request: RequestClient, segmentId: string): Promise<string> {
  const response = await request<GetSegmentResponse>(
    `${CONSTANTS.API_BASE_URL}${CONSTANTS.SEGMENT_ENDPOINT}/${segmentId}`,
    {
      method: 'GET'
    }
  )

  if (response.data.id !== segmentId) {
    throw new IntegrationError(`Pendo segment with ID ${segmentId} not found`, 'SEGMENT_NOT_FOUND', 404)
  }

  return segmentId
}
