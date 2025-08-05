import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import syncAudience from './syncAudience'
import syncEvent from './syncEvent'

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
        description:
          "The Taguchi URL Segment will send data to. This should be created in the Taguchi User Interface by navigating to 'Taguchi Integrations' then 'Integrations Setup.'",
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
    testAuthentication: (request, { settings }) => {
      // Replace /prod with /test in the integration URL for testing
      const testUrl = settings.integrationURL.replace('/prod', '/test')
      return request(`${testUrl}/subscriber`, {
        method: 'POST',
        json: [
          {
            profile: {
              organizationId: Number(settings.organizationId),
              ref: 'test-connection',
              firstname: 'Test'
            }
          }
        ],
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`
        }
      })
    }
  },
  onDelete: async (_request, { settings: _settings, payload: _payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },
  actions: {
    syncAudience,
    syncEvent
  }
}

export default destination
