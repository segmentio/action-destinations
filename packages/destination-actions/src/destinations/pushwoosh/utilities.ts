import { removeUndefined, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as TrackEventPayload } from './trackEvent/generated-types'

export function removeEmpty(obj: unknown) {
  if (!obj) {
    return obj
  }

  const cleaned = removeUndefined(obj)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (typeof cleaned === 'object' && Object.keys(cleaned!).length > 0) {
    return cleaned
  }

  return undefined
}

export function getEndpoint(url: string) {
  return 'https://integration-segment.svc-nue.pushwoosh.com' + url
}

export function sendPostEvent(request: RequestClient, settings: Settings, payload: TrackEventPayload) {
  const endpoint = getEndpoint('/integration-segment/v1/post-events')
  return request(endpoint, {
    method: 'post',
    json: {
      events: [
        {
          user_id: payload.external_id,
          device_id: payload.device_id,
          device_platform: payload.device_platform,
          app_code: settings.pushwooshAppCode,
          name: payload.name,
          timestamp: payload.timestamp,
          attributes: payload.properties
        }
      ]
    }
  })
}

export function sendBatchedPostEvent(request: RequestClient, settings: Settings, payloads: TrackEventPayload[]) {
  const payload = payloads.map((payload) => {
    return {
      user_id: payload.external_id,
      device_id: payload.device_id,
      device_platform: payload.device_platform,
      app_id: settings.pushwooshAppCode,
      name: payload.name,
      timestamp: payload.timestamp,
      attributes: payload.properties
    }
  })

  const endpoint = getEndpoint('/integration-segment/v1/post-events')
  return request(endpoint, {
    method: 'post',
    json: {
      events: payload
    }
  })
}
