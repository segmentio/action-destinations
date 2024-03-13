import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Kafka',
  slug: 'actions-kafka',
  mode: 'cloud',
  description: 'Send data to a Kafka topic',
  authentication: {
    scheme: 'custom',
    fields: {
      brokers: {
        label: 'Brokers',
        description:
          'The brokers for your Kafka instance, in the format of `host:port`. E.g. localhost:9092. Accepts a comma delimited string.',
        type: 'string',
        required: true
      },
      mechanism: {
        label: 'SASL Authentication Mechanism',
        description: 'The Authentication Mechanism for your Kafka instance.',
        type: 'string',
        required: true,
        choices: [
          { label: 'Plain', value: 'plain' },
          { label: 'SCRAM/SHA-256', value: 'scram-sha-256' },
          { label: 'SCRAM/SHA-512', value: 'scram-sha-512' },
          { label: 'AWS IAM', value: 'aws' }
        ],
        default: 'plain'
      },
      clientId: {
        label: 'Client ID',
        description: "The client ID for your Kafka instance. Defaults to 'segment-actions-kafka-producer'.",
        type: 'string',
        required: true,
        default: 'segment-actions-kafka-producer'
      },
      username: {
        label: 'Username or IAM Access Key ID',
        description:
          'The username for your Kafka instance. If using AWS IAM Authentication this should be your AWS Access Key ID.',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password or IAM Secret Key',
        description:
          'The password for your Kafka instance. If using AWS IAM Authentication this should be your AWS Secret Key.',
        type: 'password',
        required: true
      },
      partitionerType: {
        label: 'Partitioner Type',
        description: "The partitioner type for your Kafka instance. Defaults to 'Default Partitioner'.",
        type: 'string',
        required: true,
        choices: [
          { label: 'Default Partitioner', value: 'DefaultPartitioner' },
          { label: 'Legacy Partitioner', value: 'LegacyPartitioner' }
        ],
        default: 'DefaultPartitioner'
      },
      authorizationIdentity: {
        label: 'AWS Authorization Identify',
        description:
          "The aws:userid of the AWS IAM identity. Required if 'SASL Authentication Mechanism' field is set to 'AWS IAM'.",
        type: 'string',
        required: false,
        default: ''
      },
      ssl: {
        label: 'SSL Configuration Options',
        description: 'Indicates the type of SSL to be used.',
        type: 'string',
        required: true,
        choices: [
          { label: 'No SSL Encryption', value: 'none' },
          { label: 'Default SSL Encryption', value: 'default' }
        ],
        default: 'default'
      }
    }
  },
  actions: {
    send
  }
}

export default destination
