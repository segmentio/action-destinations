import { JSONObject, RequestOptions } from '@segment/actions-core'

import { base64Encode } from './base64'
import { ContextFields } from './contextFields'

export const friendbuyBaseHost = 'fbot-sandbox.me'
export const trackUrl = `https://public.${friendbuyBaseHost}/track/`

export function createRequestParams(
  type: string,
  merchantId: string,
  friendbuyPayload: JSONObject,
  analyticsPayload: ContextFields
): RequestOptions {
  const payload = base64Encode(encodeURIComponent(JSON.stringify(friendbuyPayload)))

  const metadata = base64Encode(
    JSON.stringify({
      url: analyticsPayload.pageUrl,
      title: analyticsPayload.pageTitle,
      ipAddress: analyticsPayload.ipAddress
    })
  )
  const headers = pickDefined({
    // fbt-proxy validates the profile.domain against the Referer header.
    Referer: analyticsPayload.pageUrl,
    'User-Agent': analyticsPayload.userAgent,
    'X-Forwarded-For': analyticsPayload.ipAddress
  })

  return {
    method: 'get',
    searchParams: {
      type,
      merchantId,
      metadata,
      payload
    },
    headers
  }
}

function pickDefined<T>(obj: Record<string, T>): Record<string, NonNullable<T>> {
  const result: Record<string, NonNullable<T>> = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result[key] = value as NonNullable<T>
    }
  })
  return result
}
