import { ActionDefinition, JSONLikeObject, MultiStatusResponse, RequestClient } from '@segment/actions-core'
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
  let events
  if (!Array.isArray(payload)) {
    // Run the function for a single event
    events = getEventFromPayload(payload, settings)
  } else {
    events = payload.map((value, index) => {
      if (!value.event) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Event name is required'
        })
      } else {
        const event = getEventFromPayload(value, settings)
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: 200,
          sent: event as JSONLikeObject,
          body: 'Event sent successfully'
        })
        return event
      }
    })
  }

  const response = request<MixpanelTrackApiResponseType>(
    `${getApiServerUrl(settings.apiRegion)}/import?strict=${settings.strictMode ?? `1`}`,
    {
      method: 'post',
      json: events,
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.apiSecret}:`).toString('base64')}`
      }
    }
  )

  await handleMixPanelApiResponse(transformPayloadsType(payload), response, multiStatusResponse)
  return multiStatusResponse
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
    return processData(request, settings, [payload])
  }
}

export default action
