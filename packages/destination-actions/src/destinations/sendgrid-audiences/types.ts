export interface CreateAudienceReq {
  name: string
}

export interface CreateAudienceResp {
  name: string
  id: string
}

export interface UpsertContactsReq {
  list_ids: string[]
  contacts: Array<
    {
      external_id?: string
      email?: string
      phone_number_id?: string
      anonymous_id?: string
    } & ({ external_id: string } | { email: string } | { phone_number_id: string } | { anonymous_id: string })
  >
}

export interface SearchContactsResp {
  result: Array<
    {
      id: string
      external_id?: string
      email?: string
      phone_number_id?: string
      anonymous_id?: string
    } & ({ external_id: string } | { email: string } | { phone_number_id: string } | { anonymous_id: string })
  >
}

export interface AddRespError {
  response: {
    status: number
    data: {
      errors: Array<{
        message: string
        field: string
      }>
    }
  }
}
