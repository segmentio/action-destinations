import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import identifyUser from './identifyUser'
import trackEvent from './trackEvent'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Event',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Identify User',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Sprig',
  slug: 'actions-sprig',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Sprig API key.',
        type: 'string',
        required: true
      }
    }
    //testAuthentication: (_request) => {
    //  // Return a request that tests/validates the user's credentials.
    //  // If you do not have a way to validate the authentication fields safely,
    //  // you can remove the `testAuthentication` function, though discouraged.
    //}
  },

  //onDelete: async (_request, { settings, payload }) => {
  //  // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //  // provided in the payload. If your destination does not support GDPR deletion you should not
  //  // implement this function and should remove it completely.
  //},
  presets,
  actions: {
    identifyUser,
    trackEvent
  }
}

export default destination
