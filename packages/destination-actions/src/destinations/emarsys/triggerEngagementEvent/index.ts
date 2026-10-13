import { APIError, ActionDefinition, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getAuthHeader, getApiBaseUrl, TriggerEventData } from '../emarsys-helper'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Engagement Event',
  description:
    'Trigger an engagement event (only available with new authentication). JSON schema must be configured in Engagement cloud before it can be used here.',
  fields: {
    integrationId: {
      label: 'Id of the integration',
      description: 'The id of the integration',
      type: 'string',
      required: true,
      dynamic: false
    },
    eventConfigurationId: {
      label: 'Id of the event configuration',
      description: 'The id of the event configuration',
      type: 'string',
      required: true,
      dynamic: false
    },
    event_payload: {
      label: 'Event payload',
      description: 'A JSON object that will be passed to the Engagement Cloud',
      type: 'object',
      additionalProperties: true,
      required: false,
      allowNull: true
    }
  },
  perform: async (request, data) => {
    const integrationId = String(data.payload.integrationId).replace(/[^a-z0-9-]/g, '')
    const eventConfigurationId = String(data.payload.eventConfigurationId).replace(/[^a-z0-9-]/g, '')

    const authHeader = await getAuthHeader(request, data.settings)
    const payload = <TriggerEventData>data.payload.event_payload ?? null

    const response = await request(
      `${getApiBaseUrl(
        data.settings,
        '/api/engagementevent/v1/'
      )}integrations/${integrationId}/eventConfigurations/${eventConfigurationId}/events`,
      {
        method: 'post',
        json: payload,
        headers: authHeader,
        throwHttpErrors: false
      }
    )

    switch (response?.status) {
      case 200:
      case 202:
        return response
      case 400:
        throw new APIError('The event could not be triggered (event not connected to a program?)', 400)
      case 403:
        throw new APIError('Please check the permission of your API credentials', 403)
      case 422: {
        let errorbody: { error?: { message?: string } } = {}
        try {
          errorbody = await response.json()
        } catch (err) {
          throw new APIError('Unprocessable entity. Invalid JSON response', 422)
        }
        throw new APIError(`Unprocessable entity: ${errorbody.error?.message}`, 422)
      }

      case 429:
        throw new RetryableError('Rate limit reached.')
      default:
        throw new RetryableError('There seems to be an API issue.')
    }
  }
}

export default action
