import { REGIONS } from './constants'

export type PendoDomain = typeof REGIONS[keyof typeof REGIONS]['domain']

export interface CreateSegmentJSON {
  name: string
  visitors: string[]
}

export interface CreateSegmentResponse {
  segmentId: string
}

export interface GetSegmentResponse {
  id?: string
}