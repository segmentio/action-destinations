import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEmail from './sendEmail'

const destination: DestinationDefinition<Settings> = {
  name: 'Engage Messaging SendGrid',
  slug: 'actions-personas-messaging-sendgrid',
  mode: 'cloud',
  description: 'This is an Engage specific action to send an email',
  authentication: {
    scheme: 'custom',
    fields: {
      unlayerApiKey: {
        label: 'Unlayer API Key',
        type: 'password',
        description: 'The API key for your Unlayer account'
      },
      sendGridApiKey: {
        label: 'API Key',
        type: 'password',
        description: 'The Api Key for your SendGrid account',
        required: true
      },
      profileApiEnvironment: {
        label: 'Profile API Environment',
        description: 'Profile API Environment',
        type: 'string',
        required: true
      },
      profileApiAccessToken: {
        label: 'Profile API Access Token',
        description: 'Profile API Access Token',
        type: 'password',
        required: true
      },
      spaceId: {
        label: 'Space ID',
        description: 'Space ID',
        type: 'string',
        required: true
      },
      sourceId: {
        label: 'Source ID',
        description: 'Source ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.sendgrid.com/v3/mail_settings')
    }
  },
  actions: {
    sendEmail
  }
}

export default destination
