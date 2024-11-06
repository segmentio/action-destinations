export interface CreateAudienceReq {
  name: string
}

export interface CreateAudienceResp {
  data: {
    name: string
    id: string
  }
}

export interface UpsertContactsReq {
  list_ids: string[],
  contacts: Array<{
    email?: string,
    phone_number_id?: string,
    external_id?: string,
    anonymous_id?: string
  } & (
    | { email: string }
    | { phone_number_id: string }
    | { external_id: string }
    | { anonymous_id: string }
  )>
}