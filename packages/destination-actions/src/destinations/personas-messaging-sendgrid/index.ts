import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEmail from './sendEmail'

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Personas Messaging Sendgrid',
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
