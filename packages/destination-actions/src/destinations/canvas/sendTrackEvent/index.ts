import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { perform, performBatch } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track Event',
  description: 'Adds a track event in Canvas',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      description: 'The name of the event.',
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'A JSON object containing the properties of the event.',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    ...commonFields
  },
  perform: perform('track'),
  performBatch: performBatch('track')
}

export default action
