import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Rokt Capi',
  slug: 'actions-rokt-capi',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Rokt CAPI API Key. Contact your Rokt representative to obtain this value.',
        type: 'string',
        format: 'password',
        required: true
      }, 
      apiSecret: {
        label: 'API Secret',
        description: 'Your Rokt CAPI API Secret. Contact your Rokt representative to obtain this value.',
        type: 'string',
        format: 'password',
        required: true
      }
      // datacenter: {
      //   label: 'Data Center',
      //   description: 'The Rokt data center to which you want to send data.',
      //   type: 'string',
      //   required: true,
      //   default: 'US2',
      //   choices: [
      //     { label: 'US1', value: 'US1' },
      //     { label: 'US2', value: 'US2' },
      //     { label: 'EU1', value: 'EU1' },
      //     { label: 'AU1', value: 'AU1' }
      //   ]
      // }
    },
    extendRequest: (request, { settings }) => {
// You can manually construct and set the Authorization header when making requests to the Events API.
// Steps:
// Concatenate your API key and secret using a colon (:):
//  example-api-key:example-api-secret
// Base64 encode the result using UTF-8:
//  ZXhhbXBsZS1hcGkta2V5OmV4YW1wbGUtYXBpLXNlY3JldA==
// Prefix the encoded value with the authorization method and a space:
//  Basic ZXhhbXBsZS1hcGkta2V5OmV4YW1wbGUtYXBpLXNlY3JldA==
// Set the final value as the Authorization header in your HTTP request:
//  Authorization: Basic ZXhhbXBsZS1hcGkta2V5OmV4YW1wbGUtYXBpLXNlY3JldA==
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },
  actions: {
    send
  }
}

export default destination
