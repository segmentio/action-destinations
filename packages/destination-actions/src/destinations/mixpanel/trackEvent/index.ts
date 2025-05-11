import { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from '../mixpanel-types'
import { getApiServerUrl } from '../common/utils'
import { getEventProperties } from './functions'
import { eventProperties } from '../mixpanel-properties'
import { MixpanelTrackApiResponseType, handleMixPanelApiResponse } from '../common/utils'
import { Features } from '@segment/actions-core/mapping-kit'

const getEventFromPayload = (payload: Payload, settings: Settings): MixpanelEvent => {
  const event: MixpanelEvent = {
    event: payload.event,
    properties: {
      ...getEventProperties(payload, settings)
    }
  }
  return event
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[], features?: Features) => {
  const events: MixpanelEvent[] = payload.map((value) => {
    return getEventFromPayload(value, settings)
  })
  const throwHttpErrors = features && features['mixpanel-multistatus'] ? false : true

  const response = await callMixpanelApi(request, settings, events, throwHttpErrors)
  if (features && features['mixpanel-multistatus']) {
    return handleMixPanelApiResponse(payload.length, response, events)
  }
  return response
}

const callMixpanelApi = async (
  request: RequestClient,
  settings: Settings,
  events: MixpanelEvent[],
  throwHttpErrors: boolean
) => {
  return await request<MixpanelTrackApiResponseType>(
    `${getApiServerUrl(settings.apiRegion)}/import?strict=${settings.strictMode ?? `1`}`,
    {
      method: 'post',
      json: events,
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.apiSecret}:`).toString('base64')}`
      },
      throwHttpErrors: throwHttpErrors
    }
  )
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description:
    'Send an event to Mixpanel. [Learn more about Events in Mixpanel](https://help.mixpanel.com/hc/en-us/articles/360041995352-Mixpanel-Concepts-Events?source=segment-actions)',
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

  performBatch: async (request, { settings, payload, features }) => {
    return processData(request, settings, payload, features)
  },

  perform: async (request, { settings, payload, features }) => {
    return processData(request, settings, [payload], features)
  }
}

export default action
