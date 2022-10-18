import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import contact from './contact'
import dataExtension from './dataExtension'
import contactDataExtension from './contactDataExtension'
import apiEvent from './apiEvent'

interface RefreshTokenResponse {
  access_token: string
}

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
          'The unique subdomain Salesforce Marketing Cloud assigned to your account. Subdomains are tenant specific and should be a 28-character string starting with the letters "mc". Do not include the .rest.marketingcloudapis.com part of your subdomain URL. See more information on how to find your subdomain [here](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/your-subdomain-tenant-specific-endpoints.html).',
        type: 'string',
        required: true
      },
      token: {
        label: 'Token',
        description: 'STAGE TESTING',
        type: 'string',
        required: true
      },
      account_id: {
        label: 'account id',
        description: 'STAGE TESTING',
        type: 'string',
        required: true
      },
      client_id: {
        label: 'client_id',
        description: 'STAGE TESTING',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'client_secret',
        description: 'STAGE TESTING',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      const baseUrl = `https://${settings.subdomain}.auth.marketingcloudapis.com/v2/token`
      const res = await request<RefreshTokenResponse>(`${baseUrl}`, {
        method: 'POST',
        body: new URLSearchParams({
          account_id: settings.account_id,
          client_id: settings.client_id,
          client_secret: settings.client_secret,
          grant_type: 'client_credentials'
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
  actions: {
    contact,
    dataExtension,
    contactDataExtension,
    apiEvent
  }
}

export default destination
