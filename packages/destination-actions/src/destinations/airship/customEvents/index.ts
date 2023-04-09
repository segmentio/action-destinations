import type { ActionDefinition } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import {sendCustomEvent} from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Events',
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
    name: {
      label:'Name',
      description: 'Event Name',
      type: 'string',
      required:true,
      default: {
        '@path': '$.event'
      }
    },
    occurred: {
      label: 'Occurred',
      description: 'When the event occurred.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.receivedAt'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
   },
  perform: (request, { settings, payload }) => {
    return sendCustomEvent(request, settings,payload)
}}

export default action
