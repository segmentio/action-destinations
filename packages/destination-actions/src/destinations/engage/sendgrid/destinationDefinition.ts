import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { actionDefinition as sendEmail } from './sendEmail'
import { actionDefinition as previewApiLookup } from './previewApiLookup'

export const destinationDefinition: DestinationDefinition<Settings> = {
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
      },
      region: {
        label: 'Region',
        description: 'The region where the email is originating from',
        type: 'string',
        choices: [
          { value: 'us-west-2', label: 'US West 2' },
          { value: 'eu-west-1', label: 'EU West 1' }
        ],
        default: 'us-west-2',
        required: false
      }
    },
    testAuthentication: (request) => {
      return request('https://api.sendgrid.com/v3/mail_settings')
    }
  },
  actions: {
    sendEmail,
    previewApiLookup
  }
}
