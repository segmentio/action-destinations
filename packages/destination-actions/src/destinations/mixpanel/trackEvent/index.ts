import {
  ActionDefinition,
  HTTPError,
  JSONLikeObject,
  MultiStatusResponse,
  RequestClient,
  ModifiedResponse
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from '../mixpanel-types'
import { getApiServerUrl } from '../common/utils'
import { getEventProperties } from './functions'
import { eventProperties } from '../mixpanel-properties'
import { MixpanelTrackApiResponseType, handleMixPanelApiResponse, transformPayloadsType } from '../common/utils'

const getEventFromPayload = (payload: Payload, settings: Settings): MixpanelEvent => {
  const event: MixpanelEvent = {
    event: payload.event,
    properties: {
      ...getEventProperties(payload, settings)
    }
  }
  return event
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const multiStatusResponse = new MultiStatusResponse()
  const events: MixpanelEvent[] = payload.map((value, index) => {
    const event = getEventFromPayload(value, settings)
    multiStatusResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: event as JSONLikeObject,
      body: 'Ok'
    })
    return event
  })
  try {
    await callMixpanelApi(request, settings, events)
  } catch (error) {
    if (error instanceof HTTPError) {
      const errorResponse = error.response as ModifiedResponse<MixpanelTrackApiResponseType>
      await handleMixPanelApiResponse(transformPayloadsType(payload), errorResponse, multiStatusResponse, events)
    } else {
      throw error
    }
  }

  return multiStatusResponse
}

const callMixpanelApi = async (request: RequestClient, settings: Settings, events: MixpanelEvent[]) => {
  return await request<MixpanelTrackApiResponseType>(
    `${getApiServerUrl(settings.apiRegion)}/import?strict=${settings.strictMode ?? `1`}`,
    {
      method: 'post',
      json: events,
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.apiSecret}:`).toString('base64')}`
      }
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

  performBatch: async (request, { settings, payload }) => {
    return processData(request, settings, payload)
  },

  perform: async (request, { settings, payload }) => {
    const events = getEventFromPayload(payload, settings)
    return await callMixpanelApi(request, settings, [events])
  }
}

export default action
