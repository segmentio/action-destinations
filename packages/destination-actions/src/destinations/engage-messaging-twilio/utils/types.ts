import type { RequestOptions } from '@segment/actions-core'

export type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

export interface ContentTemplateResponse {
  types: {
    [type: string]: {
      body: string
      media?: string[]
    }
  }
}
