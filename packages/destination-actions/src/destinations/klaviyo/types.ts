import { HTTPError } from '@segment/actions-core'
import { Payload } from './upsertProfile/generated-types'
export class KlaviyoAPIError extends HTTPError {
  response: Response & {
    data: {
      errors: Array<{
        id: string
        status: number
        code: string
        title: string
        detail: string
        source: {
          pointer: string
        }
        meta: {
          duplicate_profile_id: string
        }
      }>
    }
    content: string
  }
}

export interface ProfileData {
  data: {
    type: string
    id?: string
    attributes: {
      email?: string
      external_id?: string
      phone_number?: string
      [key: string]: string | Record<string, unknown> | undefined
    }
  }
}

export interface EventData {
  data: {
    type: string
    attributes: {
      properties?: { products?: [] }
      time?: string | number
      value?: number
      metric: {
        data: {
          type: string
          attributes: {
            name?: string
          }
        }
      }
      profile: {
        data: {
          type: string
          attributes: {
            email?: string
            phone_number?: string
            external_id?: string
            anonymous_id?: string
          }
        }
      }
    }
  }
}

export interface listData {
  data: listAttributes[]
}

export interface listAttributes {
  type: string
  id?: string
}

export interface ListIdResponse {
  content: string
}
export interface GetListResultContent {
  data: {
    id: string
    attributes: {
      name: string
    }
  }[]
}

export interface Location {
  address1?: string | null
  address2?: string | null
  city?: string | null
  region?: string | null
  zip?: string | null
  latitude?: string | null
  longitude?: string | null
  country?: string | null
}

export interface ProfileAttributes {
  email?: string
  phone_number?: string
  external_id?: string
  first_name?: string
  last_name?: string
  organization?: string
  title?: string
  image?: string
  location?: Location | null
  properties?: Record<string, any>
  list_id?: string
}

export interface ImportJobPayload {
  type: string
  attributes: {
    profiles: {
      data: {
        type: string
        attributes: ProfileAttributes
      }[]
    }
  }
  relationships?: {
    lists: {
      data: {
        type: string
        id: string
      }[]
    }
  }
}

export interface Profile {
  type: string
  id: string
}

export interface GetProfileResponse {
  data: Profile[]
}

export interface SubscribeProfile {
  type: string
  attributes: {
    email?: string
    phone_number?: string
    subscriptions: {
      email?: {
        marketing: {
          consent: string
          consented_at?: string | number
        }
      }
      sms?: {
        marketing: {
          consent: string
          consented_at?: string | number
        }
      }
    }
  }
}

export interface SubscribeEventData {
  data: {
    type: string
    attributes: {
      custom_source?: string | number
      profiles: {
        data: SubscribeProfile[]
      }
    }
    relationships?: {
      list: {
        data: {
          type: string
          id: string
        }
      }
    }
  }
}

export interface UnsubscribeProfile {
  type: string
  attributes: {
    email?: string
    phone_number?: string
  }
}

export interface UnsubscribeEventData {
  data: {
    type: string
    attributes: {
      profiles: {
        data: UnsubscribeProfile[]
      }
    }
    relationships?: {
      list: {
        data: {
          type: string
          id: string
        }
      }
    }
  }
}

export interface GroupedProfiles {
  [listId: string]: Payload[]
}

export interface AdditionalAttributes {
  first_name?: string
  last_name?: string
  organization?: string
  title?: string
  image?: string
}
