import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'
import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'AWS SQS',
  slug: 'actions-aws-sqs',
  mode: 'cloud',
  description:
    'Amazon Simple Queue Service (SQS) is a fully managed message queuing service. This destination enables delivery of Segment events to SQS queues for asynchronous processing.',
  authentication: {
    scheme: 'custom',
    fields: {
      iamRoleArn: {
        type: 'string',
        label: 'IAM Role ARN',
        description:
          'The ARN of the IAM role to assume for SQS access. Format: arn:aws:iam::<account-id>:role/<role-name>. Must have sqs:SendMessage and sqs:SendMessageBatch permissions.',
        required: true
      },
      iamExternalId: {
        type: 'password',
        label: 'External ID',
        description:
          "The external ID for cross-account role assumption. Used as a shared secret between Segment and the customer's IAM trust policy.",
        required: true
      }
    },
    testAuthentication: async (_, { settings }) => {
      await assumeRole(settings.iamRoleArn, settings.iamExternalId, APP_AWS_REGION)
      return true
    }
  },
  extendRequest() {
    return {
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },
  actions: {
    send
  }
}

export default destination
