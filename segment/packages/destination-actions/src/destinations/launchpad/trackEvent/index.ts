import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LaunchpadEvent } from '../launchpad-types'
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

const processData = async (request: RequestClient, settings: Settings, payload: Payload) => {
  const event = getEventFromPayload(payload, settings)
  const urlAddendum = 'capture'

  const requestURL: string = `${getApiServerUrl(settings.apiRegion)}` + urlAddendum

  return request(requestURL, {
    method: 'post',
    json: event
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
    return processData(request, settings, payload)
  }
}

export default trackEvent
