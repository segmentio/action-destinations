import type {DestinationDefinition} from '@segment/actions-core'
import type {Settings} from './generated-types'

import userUpload from './userUpload'

import userDelete from './userDelete'

const destination: DestinationDefinition<Settings> = {
  name: 'Clevertap (Actions)',
  slug: 'actions-clevertap',
  mode: 'cloud',
  description: 'Send events server-side to Clevertap',
  authentication: {
    scheme: 'custom',
    fields: {
      clevertapAccountId: {
        label: 'CleverTap Account ID',
        description: 'Your CleverTap Account ID.',
        type: 'string',
        required: true
      },
      clevertapPasscode: {
        label: 'CleverTap Account Passcode',
        description: 'Your CleverTap Account Passcode.',
        type: 'string',
        required: true
      },
      clevertapEndpoint: {
        label: 'REST Endpoint',
        description: 'Your Clevertap REST endpoint. [See more details](https://docs.clevertap.com/docs)',
        type: 'string',
        format: 'uri',
        choices: [
          {label: 'SK', value: 'https://sk1.api.clevertap.com'},
          {label: 'EU', value: 'https://eu1.api.clevertap.com'},
          {label: 'US', value: 'https://us1.api.clevertap.com'},
          {label: 'SG', value: 'https://sg1.api.clevertap.com'},
          {label: 'IN', value: 'https://in1.api.clevertap.com'}
        ],
        default: 'https://sk1.api.clevertap.com',
        required: true
      }
    }
  },

  actions: {
    userUpload,
    userDelete
  }
}

export default destination
