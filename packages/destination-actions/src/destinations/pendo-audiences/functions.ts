import { RequestClient, IntegrationError, ErrorCodes } from '@segment/actions-core'
import { PendoDomain } from './types'
import type { CreateSegmentJSON, CreateSegmentResponse, GetSegmentResponse } from './types'
import { REGIONS, SEGMENT_ENDPOINT } from './constants'

export async function createSegment(request: RequestClient, region: string, name: string): Promise<string> {
  const json: CreateSegmentJSON = { 
    name, 
    visitors: ["empty-visitor"] // Pendo requires at least one visitor to create a segment, but it can be an empty placeholder since we'll be updating the segment with the actual visitors in the syncAudience function
  }
  const response = await request<CreateSegmentResponse>(
    `${getDomain(region)}/${SEGMENT_ENDPOINT}/upload`,
    {
      method: 'POST',
      json
    }
  )

  return response.data.segmentId
}

export async function getSegment(request: RequestClient, region: string, segmentId: string): Promise<string> {
  const response = await request<GetSegmentResponse>(
    `${getDomain(region)}/${SEGMENT_ENDPOINT}/${segmentId}`,
    {
      method: 'GET'
    }
  )

  if (response.data.id !== segmentId) {
    throw new IntegrationError(`Pendo segment with ID ${segmentId} not found`, 'SEGMENT_NOT_FOUND', 404)
  }

  return segmentId
}

export function getDomain(regionName: string): PendoDomain {
  const region = Object.values(REGIONS).find(r => r.name === regionName)

  if (!region) {
    throw new IntegrationError(`Invalid region: ${regionName}`, ErrorCodes.NOT_IMPLEMENTED, 400);
  }

  return region.domain
}