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