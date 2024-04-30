import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'
import { mobileFields } from '../schema'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom third-party event',
  description: 'Fire arbitrary, custom third-party events from your mobile app. (Mobile applications only)',
  fields: {
    evtname: {
      label: 'Event name',
      description: 'The name of the custom third-party event to pass to Magellan AI',
      type: 'string',
      default: { '@path': '$.event' },
      required: true
    },
    evtattrs: {
      label: 'Event attributes',
      description: 'An arbitrary JSON object containing any additional data about this event',
      type: 'object',
      default: { '@path': '$.properties' },
      required: false
    },
    ...mobileFields
  },
  perform: buildPerformer('event')
}

export default action
