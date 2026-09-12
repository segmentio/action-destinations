import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'
import { DEFAULT_ENVIRONMENT, INTEGRATION_HEADER, INTEGRATION_HEADER_VALUE } from './versioning-info'

const destination: DestinationDefinition<Settings> = {
  name: 'Tatari Web Events',
  slug: 'actions-tatari-web-events',
  mode: 'cloud',
  description: 'Send web events to Tatari for TV attribution and measurement.',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Tatari Web Events API key. Contact your Tatari account team to obtain one.',
        type: 'password',
        required: true
      },
      environment: {
        label: 'Environment',
        description: 'Tatari environment to send events to. Leave as Production unless instructed otherwise by Tatari.',
        type: 'string',
        required: true,
        choices: [
          { label: 'Production', value: 'production' },
          { label: 'Staging (Tatari internal testing only)', value: 'staging' }
        ],
        default: DEFAULT_ENVIRONMENT
      }
    },
    // TODO: V4B has no no-op / auth-check endpoint yet. Until one exists this is a
    // deliberate no-op: the core treats "no throw" as valid credentials, so a bad key
    // will only surface on the first delivery (403 Forbidden from API Gateway).
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: {
        'x-api-key': settings.apiKey,
        [INTEGRATION_HEADER]: INTEGRATION_HEADER_VALUE,
        'Content-Type': 'application/json'
      }
    }
  },

  presets: [
    {
      name: 'Send Web Event',
      subscribe: 'type = "track" or type = "page"',
      partnerAction: 'sendEvent',
      mapping: defaultValues(sendEvent.fields),
      type: 'automatic'
    }
  ],

  actions: {
    sendEvent
  }
}

export default destination
