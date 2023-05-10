import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { setAttribute } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Set Attributes',
  defaultSubscription: 'type = "identify"',
  description: '',
  fields: {
    user: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    occurred: {
      label: 'Occurred',
      description: 'When the Trait was set',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.receivedAt'
      }
    },
    attributes: {
      label: 'Attributes',
      description: 'User Identify Traits',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return setAttribute(request, settings, payload)
  }
}

export default action
