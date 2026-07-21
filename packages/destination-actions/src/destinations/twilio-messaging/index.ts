import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendMessage from './sendMessage'

const destination: DestinationDefinition<Settings> = {
  name: 'Twilio Messaging',
  slug: 'actions-twilio-messaging',
  mode: 'cloud',
  description: 'Send SMS, MMS, Whatsapp and Messenger messages with Twilio',
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
      }
    },
    testAuthentication: (request) => {
      return request(`https://api.twilio.com/2010-04-01`)
    }
  },
  extendRequest: ({ settings }) => {
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      username: settings.apiKeySID,
      password: settings.apiKeySecret
    }
  },
  actions: {
    sendMessage
  }
}

export default destination
