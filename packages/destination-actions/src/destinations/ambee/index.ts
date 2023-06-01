import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import subscribeUserToCampaign from './subscribeUserToCampaign'

const destination: DestinationDefinition<Settings> = {
  name: 'Ambee (Actions)',
  slug: 'actions-ambee',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      companyName: {
        label: 'Company Name',
        description: 'Enter your company’s name',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'API Key',
        description:
          'The API Key is available via Ambee’s API Dashboard: https://api-dashboard.getambee.com. Paste the API key generated on the homepage. For bulk use, subscribe to enterprise plan on the dashboard',
        type: 'string',
        required: true
      },
      email: {
        label: 'Email',
        description: 'Enter the email address you used to sign up for Ambee’s API Key.',
        type: 'string',
        required: true
      },
      segmentRegion: {
        label: 'Segment Region For Notifications',
        description: '...',
        type: 'string',
        choices: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' }
        ],
        default: 'US',
        required: false
      },
      segmentWriteKey: {
        label: 'Segment WriteKey For Notifications',
        description:
          'This is your Segment Source WriteKey. Use this WriteKey to send data from Ambee to your destination',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request('https://segment-api.ambeedata.com/v1/company-info', {
        method: 'post',
        json: settings
      })
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  actions: {
    subscribeUserToCampaign
  }
}

export default destination
