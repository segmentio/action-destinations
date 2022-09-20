import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import contact from './contact'

import dataExtension from './dataExtension'

const destination: DestinationDefinition<Settings> = {
  name: 'Salesforce Marketing Cloud (Actions)',
  slug: 'actions-salesforce-marketing-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      subdomain: {
        label: 'Subdomain',
        description:
          'The unique subdomain Salesforce Marketing Cloud assigned to your account. Subdomains are tenant specific and should be a 28-character string starting with the letters "mc". Do not include the .rest.marketingcloudapis.com part of your subdomain URL. See more information on how to find your subdomain [here](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/your-subdomain-tenant-specific-endpoints.html)',
        type: 'string'
      }
    }
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // },
    // refreshAccessToken: async (request, { auth }) => {
    //   // Return a request that refreshes the access_token if the API supports it
    //   const res = await request('https://www.example.com/oauth/refresh', {
    //     method: 'POST',
    //     body: new URLSearchParams({
    //       refresh_token: auth.refreshToken,
    //       client_id: auth.clientId,
    //       client_secret: auth.clientSecret,
    //       grant_type: 'refresh_token'
    //     })
    //   })

    //   //return { accessToken: res.body.access_token }
    // }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.

  actions: {
    contact,
    dataExtension
  }
}

export default destination
