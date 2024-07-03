import { Payload } from '../saveCustomEvent/generated-types'

export function transformCommonFields(payload: Payload) {
  return {
    event_id: payload.eventId,
    event_name: payload.eventName,
    ip_address: payload.ipAddress,
    user_agent: payload.userAgent,
    timestamp: payload.timestamp,
    fpb: payload.identifiers.fbp,
    fbc: payload.identifiers.fbc,
    ga: payload.identifiers.ga,
    identifiers: Object.keys(payload.identifiers).reduce((acc: { name: string; value: string }[], key) => {
      const omitKeys = ['userId', 'anonymousId', 'clientId', 'fbp', 'fbc', 'ga']
      if (omitKeys.includes(key)) {
        return acc
      }
      return [...acc, { name: key, value: String(payload.identifiers[key]) }]
    }, []),
    url: payload.page?.url,
    client_id: payload.identifiers.clientId,
    referrer: payload.page?.referrer,
    data: {
      customData: Object.entries(payload.customAttributes || {}).map(([key, value]) => ({
        name: key,
        value
      }))
    }
  }
}
