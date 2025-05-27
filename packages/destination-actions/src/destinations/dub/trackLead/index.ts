import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../config'
import { DubTrackLeadPayload } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track a Lead',
  description: 'Track a Lead for a Short Link.',
  defaultSubscription: 'type = "track" and event = "Sign Up"',
  fields: {
    clickId: {
      label: 'Click ID',
      description: 'The ID of the click in Dub. You can read this value from "dub_id" cookie.',
      type: 'string',
      required: true
    },
    eventName: {
      label: 'Event Name',
      description: 'The name of the Lead event to track.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    externalId: {
      label: 'External ID',
      description: "The unique identifier for the customer in the your app. Used to track the customer's journey.",
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    eventQuantity: {
      label: 'Event Quantity',
      description: 'The quantity of the Lead event to track.',
      type: 'number',
      required: false,
      default: {
        '@path': '$.properties.quantity'
      }
    },
    customerName: {
      label: 'Customer Name',
      description: 'The name of the customer.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: {
            '@path': '$.context.traits.name'
          },
          then: {
            '@path': '$.context.traits.name'
          },
          else: {
            '@path': '$.properties.name'
          }
        }
      }
    },
    customerEmail: {
      label: 'Customer Email',
      description: 'The email of the customer.',
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@if': {
          exists: {
            '@path': '$.context.traits.email'
          },
          then: {
            '@path': '$.context.traits.email'
          },
          else: {
            '@path': '$.properties.email'
          }
        }
      }
    },
    customerAvatar: {
      label: 'Customer Avatar',
      description: 'The avatar of the customer.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: {
            '@path': '$.context.traits.avatar'
          },
          then: {
            '@path': '$.context.traits.avatar'
          },
          else: {
            '@path': '$.properties.avatar'
          }
        }
      }
    },
    metadata: {
      label: 'Metadata',
      description: 'Additional metadata to be stored with the Lead event.',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/track/lead`, {
      method: 'POST',
      json: payload as DubTrackLeadPayload
    })
  }
}

export default action
