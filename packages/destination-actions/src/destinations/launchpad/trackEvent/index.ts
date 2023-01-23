import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LaunchpadEvent, LPBatchEvent } from '../launchpad-types'
import { getApiServerUrl } from '../utils'
import dayjs from '../../../lib/dayjs'
import { LaunchpadEventProperties } from '../launchpad-types'
import { eventProperties } from './launchpad-properties'

function generateGUID(maxlen?: number) {
  const guid = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
  return maxlen ? guid.substring(0, maxlen) : guid
}

function getEventProperties(payload: Payload, settings: Settings): LaunchpadEventProperties {
  const datetime = payload.timestamp
  const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()

  const integration = payload.context?.integration as Record<string, string>
  return {
    time: time,
    ip: payload.context?.ip,
    id: payload.event,
    anonymous_id: payload.anonymousId,
    distinct_id: payload.userId ? payload.userId : payload.anonymousId,
    context: payload.context,
    group_id: payload.groupId,
    identified_id: payload.userId,
    properties: payload.properties,
    traits: payload.traits,
    messageId: payload.messageId ?? generateGUID(),
    source: integration?.name == 'Iterable' ? 'Iterable' : 'segment',
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
  description: 'Send an event to Launchpad. [Learn more about Events in Launchpad]',
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
