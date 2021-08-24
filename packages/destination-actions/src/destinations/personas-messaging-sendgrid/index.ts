import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEmail from './sendEmail'

const destination: DestinationDefinition<Settings> = {
  name: 'Personas Messaging Sendgrid',
  mode: 'cloud',
  description: 'This is a personas specific action to send an email',
  authentication: {
    scheme: 'custom',
    fields: {
      sendGridApiKey: {
        label: 'API Key',
        type: 'password',
        description: 'The Api Key for your sendGrid account',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's authentication fields here
      return request('https://api.sendgrid.com/v3/mail_settings')
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.sendGridApiKey}` },
      responseType: 'json'
    }
  },
  actions: {
    sendEmail
  }
}

export default destination
