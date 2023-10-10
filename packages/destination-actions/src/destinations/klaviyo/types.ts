import { HTTPError } from '@segment/actions-core'

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
