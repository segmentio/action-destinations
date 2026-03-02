export interface CreateSegmentRequest {
  name: string
  visitors: string[]
}

export interface CreateSegmentResponse {
  segmentId: string
  statusUrl: string
}

export interface SegmentStatusResponse {
  entityTagId?: string
  status?: number
  message?: string
}

export interface PendoErrorResponse {
  status?: number
  message?: string
}