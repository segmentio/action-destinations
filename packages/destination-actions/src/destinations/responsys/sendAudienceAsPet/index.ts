import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateListMemberPayload } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Audience as Pet',
  description: 'Send Engage Audience to a separate, newly created Profile Extension Table in Responsys',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    userData: {
      label: 'Recipient Data',
      description: 'Record data that represents field names and corresponding values for each profile.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: false,
      properties: {
        EMAIL_ADDRESS_: {
          label: 'Email address',
          description: "The user's email address",
          type: 'string',
          format: 'email',
          required: false
        },
        CUSTOMER_ID_: {
          label: 'Customer ID',
          description: 'Responsys Customer ID.',
          type: 'string',
          required: false
        }
      },
      default: {
        EMAIL_ADDRESS_: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        CUSTOMER_ID_: { '@path': '$.userId' }
      }
    },
    computation_key: {
      label: 'Segment Audience Key',
      description: 'A unique identifier assigned to a specific audience in Segment.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of when the event occurred.',
      type: 'datetime',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    retry: {
      label: 'Delay (seconds)',
      description: `A delay of the selected seconds will be added before retrying a failed request.
                    Max delay allowed is 600 secs (10 mins). The default is 0 seconds.`,
      type: 'number',
      choices: [
        { label: '0 secs', value: 0 },
        { label: '30 secs', value: 30 },
        { label: '120 secs', value: 120 },
        { label: '300 secs', value: 300 },
        { label: '480 secs', value: 480 },
        { label: '600 secs', value: 600 }
      ],
      required: false,
      unsafe_hidden: true,
      default: 0
    }
  },
  perform: (request, data) => {
    const { payload, settings, statsContext } = data
    console.log(payload, settings, statsContext, request)
    validateListMemberPayload(payload.userData)
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
