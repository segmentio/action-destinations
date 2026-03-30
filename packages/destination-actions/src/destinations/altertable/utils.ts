import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as EventPayload } from './event/generated-types'
import { Payload as IdentifyPayload } from './identify/generated-types'
import { Payload as AliasPayload } from './alias/generated-types'
import { AliasJSON, EventJSON, IdentifyJSON } from './types'

type IdentifyOrEventPayload = EventPayload | IdentifyPayload

type ContextFields = NonNullable<IdentifyOrEventPayload['context']>

function contextFields(
  context: IdentifyOrEventPayload['context'] | AliasPayload['context'] | undefined
): ContextFields | undefined {
  return context as ContextFields | undefined
}

/**
 * Maps flattened Segment context (from field mappings) to Altertable properties,
 * aligned with the Segment custom function `parseContext` behavior.
 */
export function buildContextProps(context: ContextFields | undefined, channel?: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  if (context) {
    const {
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
      library_version
    } = context

    if (ip !== undefined && ip !== '') {
      result.$ip = ip
    }
    if (url) {
      result.$url = url
    }
    if (referrer) {
      result.$referer = referrer
    }
    if (os) {
      result.$os = os
    }
    if (user_agent) {
      result.$user_agent = user_agent
    }
    if (utm_campaign) {
      result.$utm_campaign = utm_campaign
    }
    if (utm_source) {
      result.$utm_source = utm_source
    }
    if (utm_medium) {
      result.$utm_medium = utm_medium
    }
    if (utm_term) {
      result.$utm_term = utm_term
    }
    if (utm_content) {
      result.$utm_content = utm_content
    }
    if (screen_width && screen_height) {
      result.$viewport = `${screen_width}x${screen_height}`
    }

    result.$lib = library_name || 'altertable-segment'
    if (library_version) {
      result.$lib_version = library_version
    }
  } else {
    result.$lib = 'altertable-segment'
  }

  // When channel is "server", set $ip to 0 so the backend does not use the request IP (matches custom function).
  if (channel === 'server' && !('$ip' in result)) {
    result.$ip = 0
  }

  return result
}

function buildTrackJSON(settings: Settings, payload: EventPayload): EventJSON {
  const { userId, anonymousId, properties } = payload
  const channel = payload.channel === 'server' ? 'server' : undefined
  const contextProps = buildContextProps(contextFields(payload.context), channel)
  const device_id = payload.context?.device_id

  return {
    environment: settings.environment,
    timestamp: payload.timestamp,
    distinct_id: userId || anonymousId,
    anonymous_id: userId && anonymousId ? anonymousId : undefined,
    device_id,
    event: payload.event,
    properties: {
      ...contextProps,
      ...properties
    }
  }
}

function buildIdentifyJSON(settings: Settings, payload: IdentifyPayload): IdentifyJSON {
  const { traits } = payload
  const channel = payload.channel === 'server' ? 'server' : undefined
  const contextProps = buildContextProps(contextFields(payload.context), channel)

  const distinctId = payload.userId || payload.anonymousId
  const anonymousId = payload.userId && payload.userId !== payload.anonymousId ? payload.anonymousId : undefined

  return {
    environment: settings.environment,
    traits: {
      ...traits,
      ...contextProps
    },
    timestamp: payload.timestamp,
    distinct_id: distinctId,
    anonymous_id: anonymousId,
    device_id: payload.context?.device_id
  }
}

function buildAliasJSON(settings: Settings, payload: AliasPayload): AliasJSON {
  return {
    environment: settings.environment,
    new_user_id: payload.userId,
    timestamp: payload.timestamp,
    distinct_id: payload.previousId,
    device_id: contextFields(payload.context)?.device_id
  }
}

export function sendTrack(request: RequestClient, settings: Settings, payload: EventPayload) {
  const json = buildTrackJSON(settings, payload)
  return request(`${settings.endpoint}/track`, {
    method: 'post',
    json
  })
}

export function sendIdentify(request: RequestClient, settings: Settings, payload: IdentifyPayload) {
  const json = buildIdentifyJSON(settings, payload)
  return request(`${settings.endpoint}/identify`, {
    method: 'post',
    json
  })
}

export function sendTrackBatch(request: RequestClient, settings: Settings, payloads: EventPayload[]) {
  const json = payloads.map((p) => buildTrackJSON(settings, p))
  return request(`${settings.endpoint}/track`, {
    method: 'post',
    json
  })
}

export function sendIdentifyBatch(request: RequestClient, settings: Settings, payloads: IdentifyPayload[]) {
  const json = payloads.map((p) => buildIdentifyJSON(settings, p))
  return request(`${settings.endpoint}/identify`, {
    method: 'post',
    json
  })
}

export function sendAlias(request: RequestClient, settings: Settings, payload: AliasPayload) {
  const json = buildAliasJSON(settings, payload)
  return request(`${settings.endpoint}/alias`, {
    method: 'post',
    json
  })
}

export function sendAliasBatch(request: RequestClient, settings: Settings, payloads: AliasPayload[]) {
  const json = payloads.map((p) => buildAliasJSON(settings, p))
  return request(`${settings.endpoint}/alias`, {
    method: 'post',
    json
  })
}
