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
      first_name?: string
      last_name?: string
      address_line_1?: string
      address_line_2?: string
      city?: string
      state_province_region?: string
      country?: string
      postal_code?: string
      custom_fields?: {
        [k: string]: string | number
      }
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
