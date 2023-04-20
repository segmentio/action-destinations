import type { commonPayload, vwoPayload } from './types'

export function formatPayload(
  name: string,
  payload: commonPayload,
  isCustomEvent: boolean,
  isTrack = false,
  apiKey = ''
) {
  let formattedProperties: { [k: string]: unknown } = {}
  const vwoUuid = payload.vwoUuid
  if (isTrack) {
    formattedProperties = { ...payload.properties }
    delete formattedProperties['vwo_uuid']
  }
  const epochTime = payload.timestamp ? new Date(payload.timestamp).valueOf() : new Date().valueOf()
  const time = Math.floor(epochTime)
  const sessionId = Math.floor(epochTime / 1000)
  const page = payload.page
    ? {
        ...payload.page,
        referrerUrl: payload.page['referrer']
      }
    : {}
  const structuredPayload: vwoPayload = {
    d: {
      msgId: `${vwoUuid}-${sessionId}`,
      visId: vwoUuid,
      event: {
        props: {
          ...formattedProperties,
          page,
          isCustomEvent,
          vwoMeta: {
            source: 'segment.cloud',
            metric: {}
          }
        },
        name,
        time
      },
      sessionId
    }
  }
  const headers: { [k: string]: string } = payload.userAgent
    ? {
        'User-Agent': payload.userAgent
      }
    : {}

  if (apiKey) {
    const visitorObj = {
      props: {
        vwo_fs_environment: apiKey
      }
    }
    structuredPayload.d.event.props.$visitor = visitorObj
    structuredPayload.d.visitor = visitorObj
  }

  if (payload.ip) {
    headers['X-Forwarded-For'] = payload.ip
  }
  return { headers, structuredPayload }
}

export function sanitiseEventName(name: string) {
  return 'segment.' + name
}

export function formatAttributes(attributes: { [k: string]: unknown } | undefined) {
  const formattedAttributes: { [k: string]: unknown } = {}
  for (const key in attributes) {
    formattedAttributes[`segment.${key}`] = attributes[key]
  }
  return formattedAttributes
}
