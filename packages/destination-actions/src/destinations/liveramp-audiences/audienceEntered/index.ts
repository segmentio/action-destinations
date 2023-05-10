import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processData } from './operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered',
  description: '',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    audience_key: {
      label: 'Audience Key',
      description: 'Identifies the user within the target audience.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    identifier_data: {
      label: 'Identifier Data',
      description: `Additional information pertaining to the user.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only',
      default: { '@path': '$.context.traits' }
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
      default: ','
    },
    audience_name: {
      label: 'Audience name',
      description: `Name of the audience the user has entered.`,
      type: 'string',
      required: true,
      default: { '@path': '$.properties.audience_key' }
    },
    received_at: {
      label: 'Received At',
      description: `Datetime at which the event was received. Used to disambiguate the resulting file.`,
      type: 'datetime',
      required: true,
      default: { '@path': '$.receivedAt' }
    }
  },
  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  },
  performBatch: (request, { settings, payload }) => {
    return processData(request, settings, payload)
  }
}

export default action
