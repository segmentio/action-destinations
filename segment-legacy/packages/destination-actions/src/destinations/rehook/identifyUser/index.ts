import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Send the identify event to create or update the customer in rehook.',
  defaultSubscription: 'type = "identify"',
  fields: {
    source_id: {
      label: 'Source ID',
      type: 'string',
      required: true,
      description: 'The unique user identifier set by you',
      default: {
        '@path': '$.userId'
      }
    },
    metadata: {
      label: 'User Metadata',
      type: 'object',
      required: false,
      description: 'Properties to set on the user profile',
      default: {
        '@path': '$.traits'
      }
    },
    referral_code: {
      label: 'Referral Code',
      type: 'string',
      allowNull: true,
      description: 'The referral code of the user',
      default: {
        '@path': '$.traits.referral_code'
      }
    }
  },
  perform: async (request, { payload }) => {
    return request('https://api.rehook.ai/customers', {
      method: 'post',
      json: payload
    })
  }
}

export default action
