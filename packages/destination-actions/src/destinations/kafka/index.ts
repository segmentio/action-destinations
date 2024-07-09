import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { validate, getTopics, DEPENDS_ON_CLIENT_CERT, DEPEONDS_ON_AWS, DEPENDS_ON_PLAIN_OR_SCRAM } from './utils'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Kafka',
  slug: 'actions-kafka',
  mode: 'cloud',
  description: 'Send data to a Kafka topic',
  authentication: {
    scheme: 'custom',
    fields: {
      clientId: {
        label: 'Client ID',
        description: "The client ID for your Kafka instance. Defaults to 'segment-actions-kafka-producer'.",
        type: 'string',
        required: true,
        default: 'segment-actions-kafka-producer'
      },
      brokers: {
        label: 'Brokers',
        description:
          'The brokers for your Kafka instance, in the format of `host:port`. E.g. localhost:9092. Accepts a comma delimited string.',
        type: 'string',
        required: true
      },
      mechanism: {
        label: 'Authentication Mechanism',
        description:
          "Select the Authentication Mechanism to use. For SCRAM or PLAIN populate the 'Username' and 'Password' fields. For AWS IAM populated the 'AWS Access Key ID' and 'AWS Secret Key' fields. For 'Client Certificate' populated the 'SSL Client Key' and 'SSL Client Certificate' fields",
        type: 'string',
        required: true,
        choices: [
          { label: 'Plain', value: 'plain' },
          { label: 'SCRAM-SHA-256', value: 'scram-sha-256' },
          { label: 'SCRAM-SHA-512', value: 'scram-sha-512' },
          //  { label: 'AWS IAM', value: 'aws' },
          { label: 'Client Certificate', value: 'client-cert-auth' }
        ],
        default: 'plain'
      },
      username: {
        label: 'Username',
        description:
          'The username for your Kafka instance. Should be populated only if using PLAIN or SCRAM Authentication Mechanisms.',
        type: 'string',
        required: false,
        depends_on: DEPENDS_ON_PLAIN_OR_SCRAM
      },
      password: {
        label: 'Password',
        description:
          'The password for your Kafka instance. Should only be populated if using PLAIN or SCRAM Authentication Mechanisms.',
        type: 'password',
        required: false,
        depends_on: DEPENDS_ON_PLAIN_OR_SCRAM
      },
      accessKeyId: {
        label: 'AWS Access Key ID',
        description:
          'The Access Key ID for your AWS IAM instance. Must be populated if using AWS IAM Authentication Mechanism.',
        type: 'string',
        required: false,
        depends_on: DEPEONDS_ON_AWS
      },
      secretAccessKey: {
        label: 'AWS Secret Key',
        description:
          'The Secret Key for your AWS IAM instance. Must be populated if using AWS IAM Authentication Mechanism.',
        type: 'password',
        required: false,
        depends_on: DEPEONDS_ON_AWS
      },
      authorizationIdentity: {
        label: 'AWS Authorization Identity',
        description:
          'AWS IAM role ARN used for authorization. This field is optional, and should only be populated if using the AWS IAM Authentication Mechanism.',
        type: 'string',
        required: false,
        depends_on: DEPEONDS_ON_AWS
      },
      ssl_enabled: {
        label: 'SSL Enabled',
        description: 'Indicates if SSL should be enabled.',
        type: 'boolean',
        required: true,
        default: true
      },
      ssl_ca: {
        label: 'SSL Certificate Authority',
        description:
          'The Certificate Authority for your Kafka instance. Exclude the first and last lines from the file. i.e `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.',
        type: 'string',
        required: false
      },
      ssl_key: {
        label: 'SSL Client Key',
        description:
          'The Client Key for your Kafka instance. Exclude the first and last lines from the file. i.e `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.',
        type: 'string',
        required: false,
        depends_on: DEPENDS_ON_CLIENT_CERT
      },
      ssl_cert: {
        label: 'SSL Client Certificate',
        description:
          'The Certificate Authority for your Kafka instance. Exclude the first and last lines from the file. i.e `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.',
        type: 'string',
        required: false,
        depends_on: DEPENDS_ON_CLIENT_CERT
      },
      ssl_reject_unauthorized_ca: {
        label: 'SSL - Reject Unauthorized Certificate Authority',
        description:
          'Whether to reject unauthorized CAs or not. This can be useful when testing, but is unadvised in Production.',
        type: 'boolean',
        required: true,
        default: true
      }
    },
    testAuthentication: async (_, { settings }) => {
      validate(settings)
      return await getTopics(settings)
    }
  },
  actions: {
    send
  }
}

export default destination
