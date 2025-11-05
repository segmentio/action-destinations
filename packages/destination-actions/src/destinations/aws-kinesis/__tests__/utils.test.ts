import {
  validateIamRoleArnFormat,
  sendDataToKinesis,
  populatePayload,
  sendToKinesis,
  sendBatchToKinesis
} from '../utils'
import { Payload } from '../send/generated-types'
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../../lib/AWS/sts'
import * as utils from '../utils'
import { APP_AWS_REGION } from '../../../lib/AWS/utils'

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

jest.mock('@aws-sdk/client-kinesis', () => ({
  KinesisClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ Records: [] })
  })),
  PutRecordsCommand: jest.fn()
}))

jest.mock('../../../lib/AWS/sts', () => ({
  assumeRole: jest.fn()
}))

jest.mock('../../../lib/AWS/utils', () => ({
  APP_AWS_REGION: 'us-east-1'
}))

describe('AWS Kinesis Utils', () => {
  const mockLogger = {
    crit: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // populatePayload
  // ---------------------------------------------------------------------------
  describe('populatePayload', () => {
    it('should group payloads by stream and region with batching', () => {
      const payloads: Payload[] = Array.from({ length: 1002 }).map((_, i) => ({
        streamName: 'my-stream',
        awsRegion: 'us-east-1',
        partitionKey: `key-${i}`,
        payload: { data: `value-${i}` }
      }))

      const streamToAwsRegion = new Map<string, string>()
      const streamToPayloads = new Map<string, any[][]>()

      populatePayload(payloads, streamToAwsRegion, streamToPayloads)

      expect(streamToAwsRegion.get('my-stream')).toBe('us-east-1')
      const batches = streamToPayloads.get('my-stream')!
      expect(batches.length).toBe(2) // 1000 + 2
      expect(batches[0].length).toBe(1000)
      expect(batches[1].length).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // sendBatchToKinesis
  // ---------------------------------------------------------------------------
  describe('sendBatchToKinesis', () => {
    it('should send data to Kinesis successfully', async () => {
      const mockCredentials = { accessKeyId: 'AKIA', secretAccessKey: 'SECRET' }

      const batch = [
        { partitionKey: 'p1', data: 'foo' },
        { partitionKey: 'p2', data: 'bar' }
      ] as any

      await sendBatchToKinesis(mockLogger as any, 'my-stream', 'us-east-1', mockCredentials, batch)

      expect(PutRecordsCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          StreamName: 'my-stream',
          Records: expect.any(Array)
        })
      )
      expect(KinesisClient).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: mockCredentials
      })
    })

    it('should log and rethrow errors on failure', async () => {
      ;(KinesisClient as jest.Mock).mockImplementationOnce(() => ({
        send: jest.fn().mockRejectedValue(new Error('Network error'))
      }))

      const batch = [{ partitionKey: 'p1', data: 'foo' }] as any

      await expect(sendBatchToKinesis(mockLogger as any, 'stream', 'region', {}, batch)).rejects.toThrow(
        'Network error'
      )

      expect(mockLogger.crit).toHaveBeenCalledWith('Failed to send batch to Kinesis:', expect.any(Error))
    })
  })

  // ---------------------------------------------------------------------------
  // sendToKinesis
  // ---------------------------------------------------------------------------
  describe('sendToKinesis', () => {
    it('should assume role and send all batches', async () => {
      ;(assumeRole as jest.Mock).mockResolvedValue({ key: 'creds' })

      const streamToAwsRegion = new Map([['stream1', 'us-east-1']])
      const streamToPayloads = new Map([
        [
          'stream1',
          [
            [
              {
                streamName: 'my-stream',
                awsRegion: 'us-east-1',
                partitionKey: `key-0`,
                payload: { data: `value-0` }
              },
              {
                streamName: 'my-stream',
                awsRegion: 'us-east-1',
                partitionKey: `key-1`,
                payload: { data: `value-1` }
              }
            ]
          ]
        ]
      ])

      await sendToKinesis(
        'arn:aws:iam::123:role/Test',
        'ext-id',
        streamToAwsRegion,
        streamToPayloads,
        mockLogger as any
      )

      expect(assumeRole).toHaveBeenCalledWith('arn:aws:iam::123:role/Test', 'ext-id', APP_AWS_REGION)
      expect(KinesisClient).toHaveBeenCalled()
      expect(PutRecordsCommand).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // sendDataToKinesis
  // ---------------------------------------------------------------------------
  describe('sendDataToKinesis', () => {
    const settings = {
      iamRoleArn: 'arn:aws:iam::123456789012:role/MyRole',
      iamExternalId: 'external-id'
    }

    it('should throw error if payloads array is empty', async () => {
      await expect(sendDataToKinesis(settings as any, [], undefined, mockLogger as any)).rejects.toThrow(
        'payloads must be a non-empty array'
      )
    })

    it('should populate payloads and call sendToKinesis', async () => {
      const payloads = [{ streamName: 'test-stream', awsRegion: 'us-east-1', partitionKey: '1' }]
      const spy = jest.spyOn(utils, 'sendToKinesis').mockResolvedValue(() => {})

      await sendDataToKinesis(settings as any, payloads as any, undefined, mockLogger as any)

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})
