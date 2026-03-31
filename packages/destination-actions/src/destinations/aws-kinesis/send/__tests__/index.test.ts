import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import type { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)

const mockSend = jest.fn()
const mockAssumeRole = jest.fn()

jest.mock('@aws-sdk/client-kinesis', () => ({
  KinesisClient: jest.fn(() => ({
    send: mockSend
  })),
  PutRecordsCommand: class {
    constructor(public input: any) {}
  }
}))

jest.mock('../../../../lib/AWS/sts', () => ({
  assumeRole: (...args: unknown[]) => mockAssumeRole(...args)
}))

const settings: Settings = {
  iamRoleArn: 'arn:aws:iam::123456789012:role/test-role',
  iamExternalId: 'test-external-id'
}

const mapping = {
  payload: { '@path': '$.' },
  streamName: 'test-stream',
  partitionKey: { '@path': '$.messageId' },
  awsRegion: 'us-east-1',
  enable_batching: true,
  batch_size: 500
}

const basePayload: Partial<SegmentEvent> = {
  userId: 'user-123',
  anonymousId: 'anon-456',
  event: 'Test Event',
  type: 'track',
  timestamp: '2026-03-31T10:00:00.000Z',
  properties: {
    product_id: 'prod-789',
    price: 99.99
  },
  messageId: 'msg-abc-123'
}

describe('AWS Kinesis Send', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Definition)
    jest.clearAllMocks()
    mockAssumeRole.mockResolvedValue({
      accessKeyId: 'AKIA...',
      secretAccessKey: 'SECRET...',
      sessionToken: 'TOKEN...'
    })
  })

  describe('successful send', () => {
    it('sends a single event with correct payload', async () => {
      mockSend.mockResolvedValueOnce({
        FailedRecordCount: 0,
        Records: [{ SequenceNumber: '123', ShardId: 'shardId-000000000000' }]
      })

      const event = createTestEvent(basePayload)

      const response = await testDestination.testAction('send', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response).toBeDefined()
      expect(mockAssumeRole).toHaveBeenCalledWith(
        'arn:aws:iam::123456789012:role/test-role',
        'test-external-id',
        'us-west-2'
      )
      expect(mockSend).toHaveBeenCalledTimes(1)

      const command = mockSend.mock.calls[0][0]
      expect(command.input.StreamName).toBe('test-stream')
      expect(command.input.Records).toHaveLength(1)
      expect(command.input.Records[0].PartitionKey).toBe('msg-abc-123')

      const recordData = JSON.parse(Buffer.from(command.input.Records[0].Data).toString())
      expect(recordData.userId).toBe('user-123')
      expect(recordData.event).toBe('Test Event')
      expect(recordData.properties.product_id).toBe('prod-789')
    })

    it('sends a batch of events', async () => {
      mockSend.mockResolvedValueOnce({
        FailedRecordCount: 0,
        Records: [
          { SequenceNumber: '123', ShardId: 'shardId-000000000000' },
          { SequenceNumber: '124', ShardId: 'shardId-000000000000' }
        ]
      })

      const events = [
        createTestEvent({ ...basePayload, messageId: 'msg-1' }),
        createTestEvent({ ...basePayload, messageId: 'msg-2', event: 'Second Event' })
      ]

      const response = await testDestination.testBatchAction('send', {
        events,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response).toBeDefined()
      expect(mockSend).toHaveBeenCalledTimes(1)

      const command = mockSend.mock.calls[0][0]
      expect(command.input.Records).toHaveLength(2)
      expect(command.input.Records[0].PartitionKey).toBe('msg-1')
      expect(command.input.Records[1].PartitionKey).toBe('msg-2')
    })
  })

  describe('error handling', () => {
    it('handles partial batch failure with MultiStatusResponse', async () => {
      mockSend.mockResolvedValueOnce({
        FailedRecordCount: 1,
        Records: [
          { SequenceNumber: '123', ShardId: 'shardId-000000000000' },
          { ErrorCode: 'ProvisionedThroughputExceededException', ErrorMessage: 'Rate exceeded' }
        ]
      })

      const events = [
        createTestEvent({ ...basePayload, messageId: 'msg-1' }),
        createTestEvent({ ...basePayload, messageId: 'msg-2' })
      ]

      const response = await testDestination.testBatchAction('send', {
        events,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response).toBeDefined()
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('throws RetryableError on ThrottlingException', async () => {
      const throttleError = new Error('Rate exceeded')
      throttleError.name = 'ThrottlingException'
      mockSend.mockRejectedValueOnce(throttleError)

      const event = createTestEvent(basePayload)

      await expect(
        testDestination.testAction('send', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(/Retryable error ThrottlingException/)
    })

    it('throws IntegrationError on ResourceNotFoundException', async () => {
      const notFoundError = new Error('Stream not found')
      notFoundError.name = 'ResourceNotFoundException'
      mockSend.mockRejectedValueOnce(notFoundError)

      const event = createTestEvent(basePayload)

      await expect(
        testDestination.testAction('send', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(/Non-retryable error ResourceNotFoundException/)
    })

    it('throws IntegrationError on AccessDeniedException', async () => {
      const accessError = new Error('Access denied')
      accessError.name = 'AccessDeniedException'
      mockSend.mockRejectedValueOnce(accessError)

      const event = createTestEvent(basePayload)

      await expect(
        testDestination.testAction('send', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(/Non-retryable error AccessDeniedException/)
    })
  })

  describe('partition key handling', () => {
    it('uses messageId as default partition key', async () => {
      mockSend.mockResolvedValueOnce({
        FailedRecordCount: 0,
        Records: [{ SequenceNumber: '123', ShardId: 'shardId-000000000000' }]
      })

      const event = createTestEvent({ ...basePayload, messageId: 'custom-msg-id' })

      await testDestination.testAction('send', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      const command = mockSend.mock.calls[0][0]
      expect(command.input.Records[0].PartitionKey).toBe('custom-msg-id')
    })
  })
})
