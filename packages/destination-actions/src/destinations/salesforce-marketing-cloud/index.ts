import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import contact from './contact'
import dataExtension from './dataExtension'
import contactDataExtension from './contactDataExtension'
import apiEvent from './apiEvent'

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
        type: 'string',
        required: true
      },
      token: {
        label: 'Token',
        description: 'STAGE TESTING',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        authorization: `Bearer ${settings.token}`
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.

  actions: {
    contact,
    dataExtension,
    contactDataExtension,
    apiEvent
  }
}

export default destination
