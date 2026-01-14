import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as EventPayload } from './event/generated-types'
import { Payload as IdentifyPayload } from './identify/generated-types'
import { BaseJSON, EventJSON, IdentifyJSON } from './types'

export function send(request: RequestClient, settings: Settings, payload: EventPayload | IdentifyPayload) {
  const {
    userId,
    anonymousId,
    type,
    timestamp,
    context: {
      ip,
      url,
      referrer,
      os,
      user_agent,
      utm_campaign,
      utm_source,
      utm_medium,
      utm_term,
      utm_content,
      screen_width,
      screen_height,
      library_name,
      library_version,
      device_id
    } = {}
  } = payload

  const contextProps = {
    ...(ip ? { $ip: ip } : {}),
    ...(url ? { $url: url } : {}),
    ...(referrer ? { $referer: referrer } : {}),
    ...(os ? { $os: os } : {}),
    ...(user_agent ? { $user_agent: user_agent } : {}),
    ...(utm_campaign ? { $utm_campaign: utm_campaign } : {}),
    ...(utm_source ? { $utm_source: utm_source } : {}),
    ...(utm_medium ? { $utm_medium: utm_medium } : {}),
    ...(utm_term ? { $utm_term: utm_term } : {}),
    ...(utm_content ? { $utm_content: utm_content } : {}),
    ...(screen_width && screen_height ? { $viewport: `${screen_width}x${screen_height}` } : {}),
    ...(library_name ? { $lib: library_name } : { $lib: 'altertable-segment' }),
    ...(library_version ? { $lib_version: library_version } : {})
  }

  const baseJSON: BaseJSON = {
    environment: settings.environment,
    timestamp,
    distinct_id: userId || anonymousId,
    anonymous_id: userId && userId !== anonymousId ? anonymousId : undefined,
    device_id
  }

  if (type === 'identify') {
    const { traits } = payload as IdentifyPayload

    const json: IdentifyJSON = {
      ...baseJSON,
      traits: {
        ...traits,
        ...contextProps
      }
    }

    return request(`${settings.endpoint}/identify`, {
      method: 'post',
      json
    })
  } else {
    const { properties } = payload as EventPayload

    const event =
      type === 'page' ? '$pageview' : type === 'screen' ? '$screenview' : ((payload as EventPayload).event as string)

    const json: EventJSON = {
      ...baseJSON,
      event,
      properties: {
        ...properties,
        ...contextProps
      }
    }

    return request(`${settings.endpoint}/track`, {
      method: 'post',
      json
    })
  }
}
