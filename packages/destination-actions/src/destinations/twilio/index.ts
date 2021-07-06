import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendSMS from './sendSms'

const destination: DestinationDefinition<Settings> = {
  name: 'Twilio',
  authentication: {
    scheme: 'basic',
    fields: {
      accountId: {
        label: 'Account Id',
        description: 'Your Twilio Account Id',
        type: 'string',
        required: true
      },
      token: {
        label: 'Token',
        description: 'Your Twilio Token.',
        type: 'string',
        required: true
      },
      phoneNumber: {
        label: 'Phone Number',
        description: 'Your Twilio Phone Number with Country Code.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.twilio.com/2010-04-01/Accounts')
    }
  },
  extendRequest({ settings }) {
    return {
      username: settings.accountId,
      password: settings.token
    }
  },
  actions: {
    sendSMS
  }
}

export default destination
