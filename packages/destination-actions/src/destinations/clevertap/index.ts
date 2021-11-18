import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import userUpload from './userUpload'

const destination: DestinationDefinition<Settings> = {
  name: 'Clevertap( Actions)',
  slug: 'clevertap',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      clevertapAccountId: {
        label: 'X-CleverTap-Account-Id: ACCOUNT_ID',
        description: 'Your CleverTap Account ID.',
        type: 'string',
        required: true
      },
      clevertapPasscode: {
        label: 'X-CleverTap-Passcode: PASSCODE',
        description: 'Your CleverTap Account Passcode.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: () => {
      return true
    }
  },

  onDelete: async () => {
    return true
  },

  extendRequest({ settings }) {
    return {
      username: settings.clevertapAccountId,
      password: settings.clevertapPasscode
    }
  },

  actions: {
    userUpload
  }
}

export default destination
