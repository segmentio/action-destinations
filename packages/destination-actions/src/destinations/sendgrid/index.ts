import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { GLOBAL_ENDPOINT, EU_ENDPOINT } from './sendgrid-properties'

import updateUserProfile from './updateUserProfile'

import sendEmail from './sendEmail'

const destination: DestinationDefinition<Settings> = {
  name: 'SendGrid',
  slug: 'actions-sendgrid',
  mode: 'cloud',
  description: 'Trigger emails from SendGrid and sync Contacts to SendGrid Markeitng Campaigns.',

  authentication: {
    scheme: 'custom',
    fields: {
      sendGridApiKey: {
        label: 'API Key',
        type: 'password',
        description: 'The Api key for your SendGrid account.',
        required: true
      },
      endpoint: {
        label: 'Regional Processing Endpoint',
        type: 'string',
        description:
          'The regional processing endpoint for your SendGrid account. [See more details](https://www.twilio.com/en-us/blog/send-emails-in-eu?_gl=1*7hyri9*_gcl_au*MTg0MTQwMjAzNi4xNzQzMDAyNzc4*_ga*MTk4OTI2MDk1LjE3NDMwMDI3Nzg.*_ga_8W5LR442LD*MTc0MzY3NTc2NC41LjAuMTc0MzY3NTc2NC4wLjAuMA..)',
        required: false,
        format: 'uri',
        default: GLOBAL_ENDPOINT,
        choices: [
          { label: `Global (${GLOBAL_ENDPOINT})`, value: GLOBAL_ENDPOINT },
          { label: `EU (${EU_ENDPOINT})`, value: EU_ENDPOINT }
        ]
      }
    },
    testAuthentication: (request, { settings }) => {
      const endpoint = settings?.endpoint || GLOBAL_ENDPOINT
      return request(`${endpoint}/v3/user/account`)
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.sendGridApiKey}`,
        Accept: 'application/json'
      }
    }
  },

  actions: {
    updateUserProfile,
    sendEmail
  }
}

export default destination
