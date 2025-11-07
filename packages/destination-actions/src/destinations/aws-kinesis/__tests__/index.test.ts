import destination from '../index'
import { assumeRole } from '../../../lib/AWS/sts'
import { validateIamRoleArnFormat } from '../utils'
import { APP_AWS_REGION } from '@segment/actions-shared'
import type { Settings } from '../generated-types'
import { createTestIntegration } from '../../../../../core/src/create-test-integration'

// --- Mock all dependencies ---
jest.mock('../../../lib/AWS/sts', () => ({
  assumeRole: jest.fn()
}))

jest.mock('../utils', () => ({
  validateIamRoleArnFormat: jest.fn()
}))

jest.mock('@segment/actions-core', () => ({
  IntegrationError: jest.fn().mockImplementation((message, code, status) => ({
    name: 'IntegrationError',
    message,
    code,
    status
  }))
}))

// jest.mock('../../../lib/AWS/utils', () => ({
//   APP_AWS_REGION: 'us-east-1'
// }))

const testDestination = createTestIntegration(destination)

describe('AWS Kinesis Destination - testAuthentication', () => {
  const validSettings: Settings = {
    iamRoleArn: 'arn:aws:iam::123456789012:role/MyRole',
    iamExternalId: 'external-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call assumeRole when IAM Role ARN format is valid', async () => {
    ;(validateIamRoleArnFormat as jest.Mock).mockReturnValue(true)
    ;(assumeRole as jest.Mock).mockResolvedValue({
      accessKeyId: 'AKIA...',
      secretAccessKey: 'SECRET...',
      sessionToken: 'TOKEN...'
    })

    await expect(testDestination.testAuthentication(validSettings)).resolves.not.toThrow()

    expect(validateIamRoleArnFormat).toHaveBeenCalledWith(validSettings.iamRoleArn)
    expect(assumeRole).toHaveBeenCalledWith(validSettings.iamRoleArn, validSettings.iamExternalId, APP_AWS_REGION)
  })

  it('should throw IntegrationError if IAM Role ARN format is invalid', async () => {
    ;(validateIamRoleArnFormat as jest.Mock).mockReturnValue(false)

    const result = testDestination.testAuthentication(validSettings)

    await expect(result).rejects.toThrow('Credentials are invalid:  The provided IAM Role ARN format is not valid')

    expect(assumeRole).not.toHaveBeenCalled()
  })

  it('should propagate errors from assumeRole', async () => {
    ;(validateIamRoleArnFormat as jest.Mock).mockReturnValue(true)
    ;(assumeRole as jest.Mock).mockRejectedValue(new Error('AssumeRole failed'))

    await expect(testDestination.testAuthentication(validSettings)).rejects.toThrow('AssumeRole failed')
  })
})
