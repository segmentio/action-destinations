import { validateIamRoleArnFormat, sendDataToKinesis } from '../utils'
import * as utils from '../utils'

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

const mockAssumeRole = jest.fn()
const mockSendBatchToKinesis = jest.fn()

// Replace the real implementations in the same module
jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils')
  return {
    ...actual,
    assumeRole: jest.fn(),
    sendBatchToKinesis: jest.fn()
  }
})

describe('sendDataToKinesis', () => {
  const mockLogger = { crit: jest.fn(), info: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(utils.assumeRole as jest.Mock).mockImplementation(mockAssumeRole)
    ;(utils.sendBatchToKinesis as jest.Mock).mockImplementation(mockSendBatchToKinesis)
  })

  it('should throw error if payloads array is empty', async () => {
    await expect(
      sendDataToKinesis({ iamRoleArn: 'arn', iamExternalId: 'ext' } as any, [], undefined, mockLogger)
    ).rejects.toThrow('payloads must be a non-empty array')
  })

  it('should call assumeRole and sendBatchToKinesis for valid payloads', async () => {
    const payloads = [
      { streamName: 'streamA', awsRegion: 'us-east-1', partitionKey: 'key1', data: 'a' },
      { streamName: 'streamA', awsRegion: 'us-east-1', partitionKey: 'key2', data: 'b' },
      { streamName: 'streamB', awsRegion: 'us-west-2', partitionKey: 'key3', data: 'c' }
    ]

    const fakeCreds = { AccessKeyId: 'abc' }
    mockAssumeRole.mockResolvedValue(fakeCreds)

    await sendDataToKinesis(
      { iamRoleArn: 'arn:aws:iam::123456789012:role/MyRole', iamExternalId: 'ext' } as any,
      payloads as any,
      undefined,
      mockLogger
    )

    expect(mockAssumeRole).toHaveBeenCalledWith('arn:aws:iam::123456789012:role/MyRole', 'ext', expect.any(String))

    // sendBatchToKinesis should be called once per batch per stream
    expect(mockSendBatchToKinesis).toHaveBeenCalledTimes(2)
    expect(mockSendBatchToKinesis).toHaveBeenCalledWith(
      mockLogger,
      'streamA',
      'us-east-1',
      fakeCreds,
      expect.arrayContaining([expect.objectContaining({ streamName: 'streamA' })])
    )
    expect(mockSendBatchToKinesis).toHaveBeenCalledWith(
      mockLogger,
      'streamB',
      'us-west-2',
      fakeCreds,
      expect.arrayContaining([expect.objectContaining({ streamName: 'streamB' })])
    )
  })

  it('should handle batching correctly if batch exceeds MAX_RECORDS_PER_BATCH', async () => {
    const { MAX_RECORDS_PER_BATCH } = jest.requireActual('../utils')
    const payloads = Array.from({ length: MAX_RECORDS_PER_BATCH + 1 }, (_, i) => ({
      streamName: 'streamA',
      awsRegion: 'us-east-1',
      partitionKey: `key${i}`,
      data: `data${i}`
    }))

    const fakeCreds = { AccessKeyId: 'xyz' }
    mockAssumeRole.mockResolvedValue(fakeCreds)

    await sendDataToKinesis(
      { iamRoleArn: 'arn:aws:iam::123456789012:role/MyRole', iamExternalId: 'ext' } as any,
      payloads as any,
      undefined,
      mockLogger
    )

    // expect two batches sent since total = MAX_RECORDS_PER_BATCH + 1
    expect(mockSendBatchToKinesis).toHaveBeenCalledTimes(2)
  })

  it('should log and rethrow errors from sendBatchToKinesis', async () => {
    const payloads = [{ streamName: 'streamA', awsRegion: 'us-east-1', partitionKey: 'key1', data: 'a' }]

    const fakeCreds = { AccessKeyId: 'xyz' }
    mockAssumeRole.mockResolvedValue(fakeCreds)
    mockSendBatchToKinesis.mockRejectedValueOnce(new Error('Kinesis failure'))

    await expect(
      sendDataToKinesis(
        { iamRoleArn: 'arn:aws:iam::123456789012:role/MyRole', iamExternalId: 'ext' } as any,
        payloads as any,
        undefined,
        mockLogger
      )
    ).rejects.toThrow('Kinesis failure')
  })
})
