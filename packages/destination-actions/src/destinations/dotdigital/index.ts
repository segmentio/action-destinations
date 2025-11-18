import btoa from 'btoa-lite'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DOTDIGITAL_API_VERSION } from '../versioning-info'

import removeContactFromList from './removeContactFromList'
import enrolContact from './enrolContact'
import addContactToList from './addContactToList'
import sendTransactionalSms from './sendTransactionalSms'
import sendSms from './sendSms'
import sendEmailCampaign from './sendEmailCampaign'
import sendTransactionalEmail from './sendTransactionalEmail'

const destination: DestinationDefinition<Settings> = {
  name: 'Dotdigital',
  description: 'Send Segment events and user profile data to Dotdigital.',
  slug: 'actions-dotdigital',
  mode: 'cloud',
  authentication: {
    scheme: 'basic',
    fields: {
      api_host: {
        label: 'Region',
        description: 'The region your account is in',
        type: 'string',
        choices: [
          { value: 'https://r1-api.dotdigital.com', label: 'r1' },
          { value: 'https://r2-api.dotdigital.com', label: 'r2' },
          { value: 'https://r3-api.dotdigital.com', label: 'r3' }
        ],
        default: 'https://r1-api.dotdigital.com',
        required: true
      },
      username: {
        label: 'Username',
        description: 'Your Dotdigital username',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'Your Dotdigital password.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request(`${settings.api_host}/${DOTDIGITAL_API_VERSION}/data-fields/`)
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Basic ${btoa(settings.username + ':' + settings.password)}`,
        'x-ddg-integration-token': '7d1e8cff-4856-4f45-93d3-dac7377a53c2'
      },
      responseType: 'json'
    }
  },

  actions: {
    removeContactFromList,
    enrolContact,
    addContactToList,
    sendTransactionalSms,
    sendSms,
    sendEmailCampaign,
    sendTransactionalEmail
  }
}

export default destination
