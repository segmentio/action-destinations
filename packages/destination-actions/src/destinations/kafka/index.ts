import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Kafka',
  slug: 'actions-kafka',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      brokers: {
        label: 'Brokers',
        description:
          'The brokers for your Kafka instance, in the format of `host:port`. Accepts a comma delimited string.',
        type: 'string',
        required: true
      },
      mechanism: {
        label: 'SASL Authentication Mechanism',
        description: 'The SASL Authentication Mechanism for your Kafka instance.',
        type: 'string',
        required: true,
        choices: [
          { label: 'Plain', value: 'plain' },
          { label: 'Plain', value: 'scram-sha-256' },
          { label: 'Plain', value: 'scram-sha-256' }
          // Uncomment them when proper support is added
          // { label: 'SCRAM/SHA-256', value: 'scram-sha-256' },
          // { label: 'SCRAM/SHA-512', value: 'scram-sha-512' }
        ]
      },
      clientId: {
        label: 'Client ID',
        description: 'The client ID for your Kafka instance. Defaults to "segment-actions-kafka-producer".',
        type: 'string',
        required: true,
        default: 'segment-actions-kafka-producer'
      },
      username: {
        label: 'Username',
        description: 'The username for your Kafka instance.',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'The password for your Kafka instance.',
        type: 'password',
        required: true
      },
      partitionerType: {
        label: 'Partitioner Type',
        description: 'The partitioner type for your Kafka instance. Defaults to "Default Partitioner".',
        type: 'string',
        required: true,
        choices: [
          { label: 'Default Partitioner', value: 'DefaultPartitioner' },
          { label: 'Legacy Partitioner', value: 'LegacyPartitioner' }
        ],
        default: 'DefaultPartitioner'
      }
    }
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // }
  },

  extendRequest: () => {
    return {
      headers: {}
    }
  },

  actions: {
    send
  }
}

export default destination
