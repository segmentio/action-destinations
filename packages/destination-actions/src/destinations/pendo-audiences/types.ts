export interface CreateSegmentJSON {
  name: string
  visitors: string[]
}

export interface CreateSegmentResponse {
  segmentId: string
  statusUrl: string
}

export interface GetSegmentResponse {
  id?: string
}

export interface PendoErrorResponse {
  status?: number
  message?: string
}