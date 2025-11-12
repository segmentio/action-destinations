import { validateIamRoleArnFormat, send } from '../utils'
import { Payload } from '../send/generated-types'
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../../lib/AWS/sts'
import { IntegrationError } from '@segment/actions-core'
import { Logger } from '@segment/actions-core/destination-kit'

describe('validateIamRoleArnFormat', () => {
  it('should return true for a valid IAM Role ARN', () => {
    const validArns = [
      'arn:aws:iam::123456789012:role/MyRole',
      'arn:aws:iam::000000000000:role/service-role/My-Service_Role',
      'arn:aws:iam::987654321098:role/path/to/MyRole',
      'arn:aws:iam::111122223333:role/MyRole-With.Special@Chars_+=,.'
    ]

    for (const arn of validArns) {
      expect(validateIamRoleArnFormat(arn)).toBe(true)
    }
  })

  it('should return false for an ARN with invalid prefix', () => {
    const invalidArn = 'arn:aws:s3::123456789012:role/MyRole'
    expect(validateIamRoleArnFormat(invalidArn)).toBe(false)
  })

  it('should return false if missing account ID', () => {
    const invalidArn = 'arn:aws:iam:::role/MyRole'
    expect(validateIamRoleArnFormat(invalidArn)).toBe(false)
  })

  it('should return false if account ID is not 12 digits', () => {
    const invalidArns = ['arn:aws:iam::12345:role/MyRole', 'arn:aws:iam::1234567890123:role/MyRole']
    for (const arn of invalidArns) {
      expect(validateIamRoleArnFormat(arn)).toBe(false)
    }
  })

  it('should return false if missing "role/" segment', () => {
    const invalidArn = 'arn:aws:iam::123456789012:MyRole'
    expect(validateIamRoleArnFormat(invalidArn)).toBe(false)
  })

  it('should return false if role name contains invalid characters', () => {
    const invalidArns = [
      'arn:aws:iam::123456789012:role/My Role', // space
      'arn:aws:iam::123456789012:role/MyRole#InvalidChar'
    ]
    for (const arn of invalidArns) {
      expect(validateIamRoleArnFormat(arn)).toBe(false)
    }
  })

  it('should return false for empty or null values', () => {
    expect(validateIamRoleArnFormat('')).toBe(false)
    // @ts-expect-error testing invalid input type
    expect(validateIamRoleArnFormat(null)).toBe(false)
    // @ts-expect-error testing invalid input type
    expect(validateIamRoleArnFormat(undefined)).toBe(false)
  })
})

jest.mock('@aws-sdk/client-kinesis')
jest.mock('../../../lib/AWS/sts')

const mockSend = jest.fn()
const mockLogger: Partial<Logger> = {
  crit: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}

describe('Kinesis send', () => {
  const mockSettings = {
    iamRoleArn: 'arn:aws:iam::123456789012:role/TestRole',
    iamExternalId: 'ext-id'
  }

  const mockPayloads: Payload[] = [
    {
      streamName: 'test-stream',
      awsRegion: 'us-east-1',
      partitionKey: 'pk-1',
      payload: { data: 'test message' },
      max_batch_size: 500,
      batch_keys: ['awsRegion']
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(assumeRole as jest.Mock).mockResolvedValue({
      accessKeyId: 'mockAccess',
      secretAccessKey: 'mockSecret',
      sessionToken: 'mockToken'
    })
    ;(KinesisClient as unknown as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }))
  })

  it('should throw IntegrationError if partitionKey is missing', async () => {
    const invalidPayload = [
      { ...mockPayloads[0], partitionKey: '' } // missing partitionKey
    ]

    await expect(send(mockSettings, invalidPayload, undefined, mockLogger as Logger)).rejects.toThrow(IntegrationError)

    expect(mockLogger.crit).not.toHaveBeenCalled()
  })

  it('should create Kinesis client and send records successfully', async () => {
    mockSend.mockResolvedValueOnce({ Records: [] })

    await send(mockSettings, mockPayloads, undefined, mockLogger as Logger)

    expect(assumeRole).toHaveBeenCalledWith(
      mockSettings.iamRoleArn,
      mockSettings.iamExternalId,
      expect.any(String) // region
    )

    expect(KinesisClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'us-east-1',
        credentials: expect.any(Object)
      })
    )

    expect(mockSend).toHaveBeenCalledWith(expect.any(PutRecordsCommand))
  })

  it('should log and rethrow error when Kinesis send fails', async () => {
    const error = new Error('Kinesis failure')
    mockSend.mockRejectedValueOnce(error)

    await expect(send(mockSettings, mockPayloads, undefined, mockLogger as Logger)).rejects.toThrow('Kinesis failure')

    expect(mockLogger.crit).toHaveBeenCalledWith('Failed to send batch to Kinesis:', error)
  })
})
