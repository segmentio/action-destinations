import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendSms from './sendSms'

const destination: DestinationDefinition<Settings> = {
  name: 'Twilio Messaging',
  slug: 'actions-twilio-messaging',
  mode: 'cloud',
  description: 'Send SMS using Twilio',
  authentication: {
    scheme: 'basic',
    fields: {
      accountSID: {
        label: 'Twilio Account SID',
        description: 'Twilio Account SID',
        type: 'string',
        required: true
      },
      apiKeySID: {
        label: 'Twilio API Key SID',
        description: 'Twilio API Key SID',
        type: 'string',
        required: true
      },
      apiKeySecret: {
        label: 'Twilio API Key Secret',
        description: 'Twilio API Key Secret',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'The region where the message is originating from',
        type: 'string',
        choices: [
          { value: 'us-west-2', label: 'US West 2' },
          { value: 'eu-west-1', label: 'EU West 1' }
        ],
        default: 'us-west-2',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`https://api.twilio.com/2010-04-01`)
    }
  },
  extendRequest: ({ settings }) => {
    return {
      username: settings.apiKeySID,
      password: settings.apiKeySecret
    }
  },
  actions: {
    sendSms
  }
}

export default destination
