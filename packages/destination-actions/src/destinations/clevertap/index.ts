import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import userUpload from './userUpload'

const destination: DestinationDefinition<Settings> = {
  name: 'Clevertap ( Actions)',
  slug: 'actions-clevertap',
  mode: 'cloud',

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
      }
    },
  },

  actions: {
    userUpload
  }
}

export default destination
