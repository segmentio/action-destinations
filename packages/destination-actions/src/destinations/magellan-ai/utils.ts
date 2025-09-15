import { RequestClient } from '@segment/actions-core'

const API_BASE_URL = 'https://mgln.ai'

function buildApiEndpoint(maiEventType: string) {
  return `${API_BASE_URL}/${maiEventType}`
}

export function buildPerformer(eventType: string) {
  const url = buildApiEndpoint(eventType)
  // @ts-ignore Segment: "Payloads may be any type so we use `any` explicitly here."
  return async function emit(request: RequestClient, { payload, settings }) {
    payload.token = settings.pixelToken
    return request(url, { method: 'post', json: payload })
  }
}
