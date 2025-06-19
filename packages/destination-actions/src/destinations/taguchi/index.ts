import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import syncAudience from './syncAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Taguchi',
  slug: 'actions-taguchi',
  mode: 'cloud',
  description: 'Sync user profile details, including Audience and Computed Trait details to Taguchi.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Taguchi API Key used to authenticate requests to the Taguchi API.', 
        type: 'string',
        required: true
      },
      integrationURL: {
        label: 'Integration URL',
        description: "The Taguchi URL Segment will send data to. This should be created in the Taguchi User Interface by navigating to 'Taguchi Integrations' then 'Integrations Setup.'",
        type: 'string',
        required: true    
      },
      organizationId: {
        label: 'Organization ID',
        description: 'The Taguchi ID of the organization to which this Subscriber belongs.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },
  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },
  actions: {
    syncAudience
  }
}

export default destination
