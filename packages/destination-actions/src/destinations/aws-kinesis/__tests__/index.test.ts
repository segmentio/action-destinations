import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { STSClient } from '@aws-sdk/client-sts'

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn(),
  AssumeRoleCommand: jest.fn()
}))

const testDestination = createTestIntegration(Destination)

const mockSend = jest.fn()

describe('AWS Kinesis Destination', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(STSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }))
    process.env.AMAZON_KINESIS_ACTIONS_ROLE_ADDRESS = 'arn:aws:iam::111111111111:role/IntermediaryRole'
    process.env.AMAZON_KINESIS_ACTIONS_EXTERNAL_ID = 'intermediary-external-id'
  })

  describe('testAuthentication', () => {
    it('should succeed with valid IAM role credentials', async () => {
      mockSend
        .mockResolvedValueOnce({
          Credentials: {
            AccessKeyId: 'AKIA_INTER',
            SecretAccessKey: 'SECRET_INTER',
            SessionToken: 'TOKEN_INTER'
          }
        })
        .mockResolvedValueOnce({
          Credentials: {
            AccessKeyId: 'AKIA_FINAL',
            SecretAccessKey: 'SECRET_FINAL',
            SessionToken: 'TOKEN_FINAL'
          }
        })

      await expect(
        testDestination.testAuthentication({
          iam_role_arn: 'arn:aws:iam::123456789012:role/test-role',
          iam_external_id: 'test-external-id'
        })
      ).resolves.not.toThrow()
    })

    it('should fail with invalid IAM role credentials', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access Denied'))

      await expect(
        testDestination.testAuthentication({
          iam_role_arn: 'arn:aws:iam::123456789012:role/invalid-role',
          iam_external_id: 'invalid-external-id'
        })
      ).rejects.toThrow()
    })
  })
})
