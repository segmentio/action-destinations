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
        type: 'string',
        description: 'The Api Key for your sendGrid account',
        required: true
      },
      profileApiEnvironment: {
        label: 'Profile API Environment',
        description: 'The Environment for Profile API Production/build',
        type: 'string',
        required: true
      },
      profileApiSpaceId: {
        label: 'Profile API Space ID',
        description: 'Your Profile API Space ID',
        type: 'string',
        required: true
      },
      sourceId: {
        label: 'Source ID',
        description: 'The ID of your Source',
        type: 'string',
        required: true
      },
      profileApiAccessToken: {
        label: 'Profile API Access Token',
        description: 'The Profile API Access Token',
        type: 'string',
        format: 'password',
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
