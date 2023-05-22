import type { RequestOptions } from '@segment/actions-core'
import { Payload } from '../sendSms/generated-types'

export type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

export interface ContentTemplateResponse {
  types: {
    [type: string]: {
      body: string
      media?: string[]
    }
  }
}

export interface TwilioApiError extends Error {
  response: {
    data: {
      code: number
      message: string
      more_info: string
      status: number
    }
    headers?: Response['headers']
  }
  code?: number
  status?: number
  statusCode?: number
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
