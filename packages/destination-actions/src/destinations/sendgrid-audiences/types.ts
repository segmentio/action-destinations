export interface CreateAudienceReq {
  name: string
}

export interface CreateAudienceResp {
  name: string
  id: string
}

export interface UpsertContactsReq {
  list_ids: string[],
  contacts: Array<{
    email: string
  }>
}

export interface GetContactsByEmailReq {
  emails: string[]
}

export interface GetContactsByEmailResp {
  result: {
    [email: string]: {
      contact: {
        id: string
        email: string
        list_ids: string[]
      }
    }
  }
}