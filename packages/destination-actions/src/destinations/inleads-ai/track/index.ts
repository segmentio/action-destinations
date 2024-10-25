import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { IntegrationBaseUrl, IntegrationName } from '../contants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: `Send track calls to ${IntegrationName}.`,
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      type: 'string',
      required: true,
      description: 'The name of the event',
      label: 'Event name',
      default: { '@path': '$.event' }
    },
    user_id: {
      type: 'string',
      required: true,
      description: 'The user id, to uniquely identify the user associated with the event',
      label: 'User id',
      default: { '@path': '$.userId' }
    },
    account_id: {
      type: 'string',
      required: false,
      description: 'The account id, to uniquely identify the account associated with the user',
      label: 'Account id',
      default: {
        '@if': {
          exists: { '@path': '$.context.groupId' },
          then: { '@path': '$.context.groupId' },
          else: { '@path': '$.groupId' }
        }
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'The properties of the track call',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Traits of the track call',
      label: 'Event Traits',
      default: { '@path': '$.context.traits' }
    },
    ...commonFields
  },
  perform: (request, data) => {
    return request(`${IntegrationBaseUrl}/events/track`, {
      method: 'post',
      headers: {
        Authorization: `Basic ${data.settings.apiKey}`
      },
      json: { ...data.payload, apiKey: data.settings.apiKey }
    })
  }
}

export default action
