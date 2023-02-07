import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import triggerStudioFlow from './triggerStudioFlow'

const destination: DestinationDefinition<Settings> = {
  name: 'Twilio Studio',
  slug: 'actions-twilio-studio',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      accountSid: {
        label: 'Account SID',
        description:
          'Your Twilio Account SID, starting with AC. You can find this in the Account Info section of your dashboard in the [Twilio Console](https://www.twilio.com/console).',
        type: 'string',
        required: true
      },
      authToken: {
        label: 'Auth Token',
        description:
          'Your Twilio Auth Token. You can find this in the Account Info section of your dashboard in the [Twilio Console](https://www.twilio.com/console).',
        type: 'password',
        required: true
      },
      spaceId: {
        label: 'Space ID',
        description: 'Your Segment Space ID.',
        type: 'string',
        required: true
      },
      profileApiAccessToken: {
        label: 'Profile API Access Token',
        description: 'Your Segment Profile API Access Token.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.twilio.com/2010-04-01/Accounts')
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.accountSid}:${settings.authToken}`).toString('base64')}`
      }
    }
  },

  actions: {
    triggerStudioFlow
  }
}

export default destination
