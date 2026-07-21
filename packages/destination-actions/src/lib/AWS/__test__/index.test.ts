import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { assumeRole } from '../sts'
import { ErrorCodes } from '@segment/actions-core'

// Mock dependencies
jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn(),
  AssumeRoleCommand: jest.fn()
}))

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mocked-session-id') }))
jest.mock('@segment/actions-core', () => ({
  IntegrationError: jest.fn().mockImplementation((message, code, status) => ({
    name: 'IntegrationError',
    message,
    code,
    status
  })),
  ErrorCodes: { INVALID_AUTHENTICATION: 'INVALID_AUTHENTICATION' }
}))

describe('assumeRole', () => {
  const mockSend = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(STSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }))
    process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS = 'arn:aws:iam::111111111111:role/IntermediaryRole'
    process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID = 'intermediary-external-id'
  })

  it('should successfully assume both intermediary and target roles', async () => {
    // Mock intermediary STS credentials
    mockSend
      .mockResolvedValueOnce({
        Credentials: {
          AccessKeyId: 'AKIA_INTERMEDIARY',
          SecretAccessKey: 'SECRET_INTERMEDIARY',
          SessionToken: 'TOKEN_INTERMEDIARY'
        }
      })
      .mockResolvedValueOnce({
        Credentials: {
          AccessKeyId: 'AKIA_FINAL',
          SecretAccessKey: 'SECRET_FINAL',
          SessionToken: 'TOKEN_FINAL'
        }
      })

    const creds = await assumeRole('arn:aws:iam::222222222222:role/TargetRole', 'external-id-final', 'us-east-1')

    expect(STSClient).toHaveBeenCalledTimes(2)
    expect(AssumeRoleCommand).toHaveBeenCalledTimes(2)

    expect(creds).toEqual({
      accessKeyId: 'AKIA_FINAL',
      secretAccessKey: 'SECRET_FINAL',
      sessionToken: 'TOKEN_FINAL'
    })
  })

  it('should throw IntegrationError if STS returns missing credentials', async () => {
    mockSend.mockResolvedValueOnce({
      Credentials: { AccessKeyId: 'X' } // missing fields
    })

    const promise = assumeRole('arn:aws:iam::222222222222:role/TargetRole', 'external-id-final', 'us-east-1')

    await expect(promise).rejects.toMatchObject({
      name: 'IntegrationError',
      message: 'Failed to assume role',
      code: ErrorCodes.INVALID_AUTHENTICATION,
      status: 403
    })
  })

  it('should pass intermediary credentials to second STS call', async () => {
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

    await assumeRole('arn:aws:iam::333333333333:role/TargetRole', 'external-id-final', 'us-west-2')

    // Check that STSClient was initialized with the intermediary creds for the second call
    expect(STSClient).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        credentials: {
          accessKeyId: 'AKIA_INTER',
          secretAccessKey: 'SECRET_INTER',
          sessionToken: 'TOKEN_INTER'
        },
        region: 'us-west-2'
      })
    )
  })
})
