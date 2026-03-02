import { RequestClient, IntegrationError } from '@segment/actions-core'
import { CONSTANTS } from './constants'
import type { CreateSegmentResponse, SegmentStatusResponse } from './types'

export async function createSegment(request: RequestClient, name: string): Promise<string> {
  const response = await request<CreateSegmentResponse>(
    `${CONSTANTS.API_BASE_URL}${CONSTANTS.SEGMENT_ENDPOINT}/upload`,
    {
      method: 'POST',
      json: {
        name,
        visitors: []
      }
    }
  )
  
  return response.data.segmentId
}

export async function getSegment(request: RequestClient, segmentId: string): Promise<string> {
  const response = await request<SegmentStatusResponse>(
    `${CONSTANTS.API_BASE_URL}${CONSTANTS.SEGMENT_ENDPOINT}/${segmentId}/status`,
    {
      method: 'GET'
    }
  )

  if (response.data.entityTagId !== segmentId) {
    throw new IntegrationError(`Pendo segment with ID ${segmentId} not found`, 'SEGMENT_NOT_FOUND', 404)
  }

  return segmentId
}
