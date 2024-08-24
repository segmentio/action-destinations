import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import addToAudience from './addToAudience'

// For an example audience destination, refer to webhook-audiences. The Readme section is under 'Audience Support'
const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Reddit Audiences',
  slug: 'actions-reddit-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        type: 'string',
        label: 'Ad Account ID',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      }
    },

    // comment out below for now and go back to it
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // },

    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const baseUrl = 'https://www.reddit.com/api/v1/access_token'
      const res = await request(baseUrl, {
        method: 'POST',
        username: auth.clientId,
        password: auth.clientSecret,
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  audienceFields: {
    adAccountId: {
      label: 'An audience id required by the destination',
      description: 'An audience id required by the destination',
      type: 'string',
      required: true
    },
    audienceId: {
      label: 'An audience id required by the destination',
      description: 'An audience id required by the destination',
      type: 'string',
      required: false
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },

    // Get/Create are optional and only needed if you need to create an audience before sending events/users.
    createAudience: async (request, createAudienceInput) => {
      const audienceName = createAudienceInput.audienceName
      const adAccountId = createAudienceInput.audienceSettings?.adAccountId
      // Create an audience through the destination's API
      // Segment will save this externalId for subsequent calls; the externalId is used to keep track of the audience in our database
      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!adAccountId) {
        throw new IntegrationError('Missing ad account ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      // TODO - Check adAccountId regex for a2_ or t2_ prefix - throw error if not

      const createAudienceUrl = `https://ads-api.reddit.com/api/v3/ad_accounts/${adAccountId}/custom_audiences`
      const payload = {
        data: {
          name: audienceName,
          type: 'CUSTOMER_LIST'
        }
      }

      const response = await request(createAudienceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log(response)

      const jsonOutput = await response.json()
      if (!jsonOutput.data['id']) {
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return { externalId: jsonOutput.data['id'] }
    },

    getAudience: async (request, getAudienceInput) => {
      // Right now, `getAudience` will mostly serve as a check to ensure the audience still exists in the destination
      const getAudienceUrl = `https://ads-api.reddit.com/api/v3/custom_audiences/${getAudienceInput.externalId}`

      const response = await request(getAudienceUrl, {
        method: 'GET'
      })
      console.log('getAudience Response:')
      console.log(response)

      const r = await response.json()
      const audienceId = r.data['id']

      if (!audienceId) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      if (getAudienceInput.externalId !== audienceId) {
        throw new IntegrationError("Couldn't find audience", 'INVALID_RESPONSE', 400)
      }

      return { externalId: audienceId }
    }
  },

  // comment out below for now and go back to it
  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    addToAudience
  }
}

export default destination
