import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import syncEvent from './syncEvent'
import syncUserProfile from './syncUserProfile'

const destination: DestinationDefinition<Settings> = {
  name: 'Taguchi',
  slug: 'actions-taguchi',
  mode: 'cloud',
  description: 'Sync analytics events, user profile details, including Audience and Computed Trait details to Taguchi.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Taguchi API Key used to authenticate requests to the Taguchi platform.',
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
      const testUrl = settings.integrationURL.replace('/prod', '/test') // this is only used for testAuth call
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
  actions: {
    syncEvent,
    syncUserProfile
  }
}

export default destination
