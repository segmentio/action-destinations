import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import type { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)

const mockSend = jest.fn()
const mockAssumeRole = jest.fn()

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn(() => ({
    send: mockSend
  })),
  SendMessageBatchCommand: class {
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
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
  awsRegion: 'us-east-1',
  messageDeduplicationId: { '@path': '$.messageId' },
  enable_batching: true,
  batch_size: 10
}

const basePayload: Partial<SegmentEvent> = {
  userId: 'user-123',
  anonymousId: 'anon-456',
  event: 'Test Event',
  type: 'track',
  timestamp: '2026-04-06T10:00:00.000Z',
  properties: {
    product_id: 'prod-789',
    price: 99.99
  },
  messageId: 'msg-abc-123'
}

describe('AWS SQS Send', () => {
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
        Successful: [{ Id: '0', MessageId: 'sqs-msg-001', MD5OfMessageBody: 'abc123' }],
        Failed: []
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
      expect(command.input.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue')
      expect(command.input.Entries).toHaveLength(1)
      expect(command.input.Entries[0].Id).toBe('0')

      const messageBody = JSON.parse(command.input.Entries[0].MessageBody)
      expect(messageBody.userId).toBe('user-123')
      expect(messageBody.event).toBe('Test Event')
      expect(messageBody.properties.product_id).toBe('prod-789')
    })

    it('sends a batch of events', async () => {
      mockSend.mockResolvedValueOnce({
        Successful: [
          { Id: '0', MessageId: 'sqs-msg-001', MD5OfMessageBody: 'abc123' },
          { Id: '1', MessageId: 'sqs-msg-002', MD5OfMessageBody: 'def456' }
        ],
        Failed: []
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
      expect(command.input.Entries).toHaveLength(2)
      expect(command.input.Entries[0].Id).toBe('0')
      expect(command.input.Entries[1].Id).toBe('1')
    })
  })

  describe('FIFO queue support', () => {
    it('includes messageGroupId when provided', async () => {
      mockSend.mockResolvedValueOnce({
        Successful: [{ Id: '0', MessageId: 'sqs-msg-001', MD5OfMessageBody: 'abc123' }],
        Failed: []
      })

      const event = createTestEvent(basePayload)

      await testDestination.testAction('send', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          ...mapping,
          queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue.fifo',
          messageGroupId: 'user-123'
        }
      })

      const command = mockSend.mock.calls[0][0]
      expect(command.input.Entries[0].MessageGroupId).toBe('user-123')
    })
  })

  describe('error handling', () => {
    it('handles partial batch failure with MultiStatusResponse', async () => {
      mockSend.mockResolvedValueOnce({
        Successful: [{ Id: '0', MessageId: 'sqs-msg-001', MD5OfMessageBody: 'abc123' }],
        Failed: [{ Id: '1', Code: 'InternalError', Message: 'Internal service error', SenderFault: false }]
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

    it('throws RetryableError on RequestThrottled', async () => {
      const throttleError = new Error('Rate exceeded')
      throttleError.name = 'RequestThrottled'
      mockSend.mockRejectedValueOnce(throttleError)

      const event = createTestEvent(basePayload)

      await expect(
        testDestination.testAction('send', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(/Retryable error RequestThrottled/)
    })

    it('throws IntegrationError on QueueDoesNotExist', async () => {
      const notFoundError = new Error('Queue not found')
      notFoundError.name = 'QueueDoesNotExist'
      mockSend.mockRejectedValueOnce(notFoundError)

      const event = createTestEvent(basePayload)

      await expect(
        testDestination.testAction('send', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(/Non-retryable error QueueDoesNotExist/)
    })

    it('throws IntegrationError on InvalidSecurity', async () => {
      const securityError = new Error('Invalid security token')
      securityError.name = 'InvalidSecurity'
      mockSend.mockRejectedValueOnce(securityError)

      const event = createTestEvent(basePayload)

      await expect(
        testDestination.testAction('send', {
          event,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(/Non-retryable error InvalidSecurity/)
    })
  })
})
