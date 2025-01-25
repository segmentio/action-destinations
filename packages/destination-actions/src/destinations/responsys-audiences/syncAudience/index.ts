import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description:
    'Sync the Audience, merging profiles with the configured Profile List, and updating the subscription status in the configure PET (Profile Extension Table).',
  fields: {
    computation_key: {
      label: 'Segment Audience Key',
      description: 'A unique identifier assigned to a specific audience in Segment.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Hidden field used to access traits or properties objects from Engage payloads.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of when the event occurred.',
      type: 'datetime',
      required: false,
      unsafe_hidden: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    default_permission_status: {
      label: 'Default Permission Status',
      description:
        'This value must be specified as either OPTIN or OPTOUT. It defaults to the value defined in this destination settings.',
      type: 'string',
      required: false,
      choices: [
        { label: 'Opt In', value: 'OPTIN' },
        { label: 'Opt Out', value: 'OPTOUT' }
      ]
    }
  },
  perform: (request, data) => {
    console.log(request, data)
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
