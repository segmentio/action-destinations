import type { DestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'

const destination: DestinationDefinition<Settings> = {
  name: 'AWS Kinesis',
  slug: 'actions-aws-kinesis',
  mode: 'cloud',
  description: 'Send data to an Amazon Kinesis stream',
  authentication: {
    scheme: 'custom',
    fields: {
      iam_role_arn: {
        label: 'IAM Role ARN',
        description:
          'IAM Role ARN with permissions to write to the Kinesis stream. Format: arn:aws:iam::account-id:role/role-name',
        type: 'string',
        required: true
      },
      iam_external_id: {
        label: 'IAM External ID',
        description: 'The External ID for the IAM role. Generate a secure string and treat it like a password.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (_request, { settings }) => {
      if (!settings.iam_role_arn || !settings.iam_external_id) {
        throw new InvalidAuthenticationError('IAM Role ARN and External ID are required')
      }
      await assumeRole(settings.iam_role_arn, settings.iam_external_id, APP_AWS_REGION)
    }
  },
  actions: {
    send
  }
}

export default destination
