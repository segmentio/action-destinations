import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processBatchPayload, processPayload } from '../function'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audiences to DSP',
  description: 'Sync audiences from Segment to Amazon Ads Audience.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
      default: {
        '@path': '$.event'
      }
    },
    externalUserId: {
      label: 'External User ID',
      description: 'This is an external user identifier defined by data providers.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    email: {
      label: 'Email',
      description: 'User email address.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      category: 'hashedPII'
    },
    firstName: {
      label: 'First name',
      description: 'User first name.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.first_name' },
      category: 'hashedPII'
    },
    lastName: {
      label: 'Last name',
      description: 'User Last name.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.last_name' },
      category: 'hashedPII'
    },
    phone: {
      label: 'Phone',
      description: 'Phone Number.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.phone' },
      category: 'hashedPII'
    },
    postal: {
      label: 'Postal',
      description: 'Postal Code.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.postal' },
      category: 'hashedPII'
    },
    state: {
      label: 'State',
      description: 'State Code.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.state' },
      category: 'hashedPII'
    },
    city: {
      label: 'City',
      description: 'City name.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.city' },
      category: 'hashedPII'
    },
    address: {
      label: 'Address',
      description: 'Address Code.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.address' },
      category: 'hashedPII'
    },
    audienceId: {
      label: 'Audience ID',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      description:
        'A number value representing the Amazon audience identifier. This is the identifier that is returned during audience creation.',
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'When enabled,segment will send data in batching',
      type: 'boolean',
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 10000
    }
  },
  perform: (request, { settings, payload, audienceSettings }) => {
    return processPayload(request, settings, [payload], audienceSettings)
  },
  performBatch: async (request, { settings, payload: payloads, audienceSettings }) => {
    return await processBatchPayload(request, settings, payloads, audienceSettings)
  }
}

export default action
