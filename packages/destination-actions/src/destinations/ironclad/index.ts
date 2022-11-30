import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import viewContract from './viewContract'

const destination: DestinationDefinition<Settings> = {
  name: 'Ironclad',
  slug: 'actions-ironclad',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      sid: {
        label: 'Site Access ID',
        description:
          'Site Access ID. An ID that’s unique for each Site within your account. Information on finding your sid can be found in the Authentication section',
        type: 'string',
        default: '410d5d75-56b6-43b5-9130-13b6ea0713c0',
        required: true
      },
      staging: {
        label: 'Staging Site',
        description: 'Execute the integration agains the Staging site',
        type: 'boolean',
        default: true
      }
    }
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // }
  },

  // extendRequest({ settings }) {
  //   return {
  //     username: settings.username,
  //     password: settings.password
  //   }
  // },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    viewContract
  }
}

export default destination
