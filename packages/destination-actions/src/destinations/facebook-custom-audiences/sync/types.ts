export interface GetAllAudienceResponse {
  data: {
    id: string
    name: string
  }[]
}

export interface FacebookSyncRequestParams {
  payload: {
    schema: string[]
    data: (string | number)[][]
    app_ids?: string[]
    page_ids?: string[]
  }
}
