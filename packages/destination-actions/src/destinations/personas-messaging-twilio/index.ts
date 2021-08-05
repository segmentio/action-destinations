import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendSms from './sendSms'

const destination: DestinationDefinition<Settings> = {
  name: 'Personas Messaging Twilio',
  authentication: {
    scheme: 'custom',
    fields: {
      twilioAccountId: {
        label: 'Twilio Account ID',
        description: 'Twilio Account ID',
        type: 'string',
        required: true
      },
      twilioAuthToken: {
        label: 'Twilio Auth Token',
        description: 'Twilio Auth Token',
        type: 'string',
        format: 'password',
        required: true
      },
      profileApiEnvironment: {
        label: 'Profile API Environment',
        description: 'Profile API Environment',
        type: 'string',
        required: true
      },
      profileApiSpaceId: {
        label: 'Profile API Space ID',
        description: 'Profile API Space ID',
        type: 'string',
        required: true
      },
      profileApiAccessToken: {
        label: 'Profile API Access Token',
        description: 'Profile API Access Token',
        type: 'string',
        format: 'password',
        required: true
      }
    },
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's authentication fields here
    }
  },
  actions: {
    sendSms
  }
}

export default destination
