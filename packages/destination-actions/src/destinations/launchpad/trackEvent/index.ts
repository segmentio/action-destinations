import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LaunchpadEvent, LPBatchEvent } from '../launchpad-types'
import { getApiServerUrl } from '../utils'
import { LaunchpadEventProperties } from '../launchpad-types'
import { eventProperties } from './launchpad-properties'

function getEventProperties(payload: Payload, settings: Settings): LaunchpadEventProperties {
  const integration = payload.context?.integration as Record<string, string>
  return {
    time: payload.timestamp,
    ip: payload.context?.ip,
    anonymous_id: payload.anonymousId,
    distinct_id: payload.userId ? payload.userId : payload.anonymousId,
    context: payload.context,
    group_id: payload.groupId,
    identified_id: payload.userId,
    properties: payload.properties,
    traits: payload.traits ? payload.traits : payload.context?.traits,
    messageId: payload.messageId,
    source: integration?.name != 'Segment' ? integration?.name : 'Segment',
    user_id: payload.userId,
    segment_source_name: settings.sourceName
  }
}

const getEventFromPayload = (payload: Payload, settings: Settings): LaunchpadEvent => {
  const event: LaunchpadEvent = {
    event: payload.event,
    properties: {
      ...getEventProperties(payload, settings)
    },
    api_key: settings.apiSecret
  }
  return event
}

const getBatchFromPayload = (payload: Payload, settings: Settings): LPBatchEvent => {
  const event: LPBatchEvent = {
    event: payload.event,
    properties: {
      ...getEventProperties(payload, settings)
    }
  }
  return event
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  let events
  let urlAddendum: string

  if (payload.length === 1) {
    events = payload.map((value) => getEventFromPayload(value, settings))
    urlAddendum = 'capture'
  } else {
    events = {
      api_key: settings.apiSecret,
      batch: payload.map((value) => getBatchFromPayload(value, settings))
    }
    urlAddendum = 'batch'
  }

  const requestURL: string = `${getApiServerUrl(settings.apiRegion)}` + urlAddendum

  return request(requestURL, {
    method: 'post',
    json: events
  })
}

const trackEvent: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Launchpad. [Learn more about Events in Launchpad](https://help.launchpad.pm)',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the action being performed.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    ...eventProperties
  },

  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return processData(request, settings, payload)
  }
}

export default trackEvent
