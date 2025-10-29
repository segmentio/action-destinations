import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
import { assumeRole } from '../../lib/AWS/sts'
import { validateIamRoleArnFormat } from './utils'
import { APP_AWS_REGION } from '../../lib/AWS/utils'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Aws Kinesis',
  slug: 'actions-aws-kinesis',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      iamRoleArn: {
        label: 'IAM Role ARN',
        description: 'The ARN of the IAM Role to assume for sending data to Kinesis.',
        type: 'string',
        required: true
      },
      iamExternalId: {
        label: 'IAM External ID',
        description:
          'The external ID to use when assuming the IAM Role. Generate a secure string and treat it like a password.  This is often used as an additional security measure.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (_, { settings }) => {
      const { iamRoleArn, iamExternalId } = settings
      console.log(123)
      if (!validateIamRoleArnFormat(iamRoleArn)) {
        throw new IntegrationError('The provided IAM Role ARN format is not valid', 'INVALID_IAM_ROLE_ARN_FORMAT', 400)
      }
      console.log(234)
      await assumeRole(iamRoleArn, iamExternalId, APP_AWS_REGION)
    }
  },

  actions: {
    send
  }
}

export default destination
