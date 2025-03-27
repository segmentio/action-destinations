import { Payload } from '../sendSms/generated-types'

export interface ContentTemplateResponse {
  types: {
    [type: string]: {
      body: string
      media?: string[]
    }
  }
}

export interface ContentTemplateResponse {
  types: {
    [type: string]: {
      body: string
      media?: string[]
    }
  }
}
export type ContentTemplateTypes = ContentTemplateResponse['types'][string]

export type Profile = {
  user_id?: string | undefined
  phone?: string
  traits: Payload['traits'] // traits are the same across all actions
}
