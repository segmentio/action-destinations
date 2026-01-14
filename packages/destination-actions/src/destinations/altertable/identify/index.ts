import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { send } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify a user in Altertable.',
  fields: {
    type: {
      label: 'Segment Event Type',
      description: 'The Segment event type',
      type: 'string',
      choices: [{ label: 'identify', value: 'identify' }],
      required: true,
      default: 'identify'
    },
    traits: {
      label: 'Traits',
      description: 'The traits of the user',
      type: 'object',
      required: true,
      default: {
        '@path': '$.traits'
      }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    return send(request, settings, payload)
  }
}

export default action
