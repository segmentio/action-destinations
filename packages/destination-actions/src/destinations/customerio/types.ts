
export type CustomerIOBatchResponse = {
    errors: TrackApiError[]
}

export type TrackApiError = {
  batch_index?: number
  reason?: string
  field?: string
  message?: string
}
