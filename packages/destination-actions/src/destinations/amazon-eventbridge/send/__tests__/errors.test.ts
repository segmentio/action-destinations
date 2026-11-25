import { createTestEvent, createTestIntegration, IntegrationError, RetryableError } from '@segment/actions-core'
import { EventBridgeClient } from '@aws-sdk/client-eventbridge'
import { send } from '../functions'
import { Payload } from '../generated-types'
import { Settings } from '../../generated-types'
import { HookOutputs } from '../types'
import { FLAGON_NAME_RETRY_CLASSIFICATION_FIX } from '../constants'
import Definition from '../../index'

const mockSend = jest.fn()
jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn(() => ({
    send: mockSend
  })),
  PutPartnerEventsCommand: class {
    constructor(public input: any) {}
  },
  ListPartnerEventSourcesCommand: jest.fn(),
  CreatePartnerEventSourceCommand: jest.fn()
}))

const settings: Settings = {
  region: 'us-east-1',
  accountId: '123456789012'
}

const hookOutputs: HookOutputs = {
  onMappingSave: { outputs: { sourceId: 'test-source' } }
}

const payload: Payload = {
  detailType: 'track',
  data: { userId: 'user1' },
  enable_batching: true
}

const flagOn = { [FLAGON_NAME_RETRY_CLASSIFICATION_FIX]: true }

function awsError(name: string, message = 'boom') {
  const error = new Error(message)
  error.name = name
  return error
}

async function captureError(features?: Record<string, boolean>): Promise<any> {
  try {
    await send([payload], settings, hookOutputs, features)
  } catch (error) {
    return error
  }
  throw new Error('Expected send to throw')
}

describe('Amazon EventBridge error classification', () => {
  beforeEach(() => {
    mockSend.mockReset()
  })

  describe('request-level errors with flag on', () => {
    it('ThrottlingException is retryable with status 429', async () => {
      mockSend.mockRejectedValueOnce(awsError('ThrottlingException', 'Rate exceeded'))
      const error = await captureError(flagOn)
      expect(error).toBeInstanceOf(RetryableError)
      expect(error.status).toBe(429)
      expect(error.message).toBe('Retryable error ThrottlingException in client.send. Message: Rate exceeded')
    })

    it.each(['InternalException', 'InternalFailure', 'ServiceUnavailable', 'ConcurrentModificationException'])(
      '%s is retryable with status 500',
      async (name: string) => {
        mockSend.mockRejectedValueOnce(awsError(name))
        const error = await captureError(flagOn)
        expect(error).toBeInstanceOf(RetryableError)
        expect(error.status).toBe(500)
      }
    )

    it.each(['LimitExceededException', 'AccessDeniedException', 'ValidationError', 'InvalidClientTokenId'])(
      '%s is non-retryable with status 400',
      async (name: string) => {
        mockSend.mockRejectedValueOnce(awsError(name))
        const error = await captureError(flagOn)
        expect(error).toBeInstanceOf(IntegrationError)
        expect(error.status).toBe(400)
        expect(error.code).toBe(name)
      }
    )

    it('unrecognised errors are retryable with status 500', async () => {
      mockSend.mockRejectedValueOnce(awsError('TimeoutError'))
      const error = await captureError(flagOn)
      expect(error).toBeInstanceOf(RetryableError)
      expect(error.status).toBe(500)
    })

    it('errors without a name are retryable with status 500', async () => {
      mockSend.mockRejectedValueOnce('not an error object')
      const error = await captureError(flagOn)
      expect(error).toBeInstanceOf(RetryableError)
      expect(error.message).toBe('Retryable error UnknownError in client.send. Message: No error message returned')
    })
  })

  describe('request-level errors with flag off keep legacy behaviour', () => {
    it('ThrottlingException is non-retryable with status 400', async () => {
      mockSend.mockRejectedValueOnce(awsError('ThrottlingException'))
      const error = await captureError()
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.status).toBe(400)
    })

    it('LimitExceededException is retryable', async () => {
      mockSend.mockRejectedValueOnce(awsError('LimitExceededException'))
      const error = await captureError()
      expect(error).toBeInstanceOf(RetryableError)
    })
  })

  describe('per-entry errors', () => {
    const entries = [
      { EventId: 'event-1' },
      { ErrorCode: 'ThrottlingException', ErrorMessage: 'Rate exceeded' },
      { ErrorCode: 'InternalFailure', ErrorMessage: 'Internal failure' },
      { ErrorCode: 'ValidationError', ErrorMessage: 'Invalid event' }
    ]

    it('maps each entry ErrorCode to its own status with flag on', async () => {
      mockSend.mockResolvedValueOnce({ FailedEntryCount: 3, Entries: entries })
      const result = await send([payload, payload, payload, payload], settings, hookOutputs, flagOn)
      expect(result.getAllResponses().map((r) => r.value().status)).toEqual([200, 429, 500, 400])
      expect(result.getResponseAtIndex(1).value()).toMatchObject({
        errormessage: 'Rate exceeded',
        errortype: 'TOO_MANY_REQUESTS',
        body: JSON.stringify(entries[1])
      })
    })

    it('marks every failed entry as 400 with flag off', async () => {
      mockSend.mockResolvedValueOnce({ FailedEntryCount: 3, Entries: entries })
      const result = await send([payload, payload, payload, payload], settings, hookOutputs)
      expect(result.getAllResponses().map((r) => r.value().status)).toEqual([200, 400, 400, 400])
    })
  })

  describe('feature flag plumbing', () => {
    const mapping = {
      data: { '@path': '$.' },
      detailType: { '@path': '$.type' },
      enable_batching: true,
      onMappingSave: { outputs: { sourceId: 'test-source' } }
    }

    it('perform passes features to send', async () => {
      mockSend.mockRejectedValueOnce(awsError('ThrottlingException'))
      const testDestination = createTestIntegration(Definition)
      await expect(
        testDestination.testAction('send', {
          event: createTestEvent({ type: 'track' }),
          settings,
          mapping,
          features: flagOn
        })
      ).rejects.toMatchObject({ status: 429 })
    })

    it.each([
      ['ThrottlingException', RetryableError, 429],
      ['InternalFailure', RetryableError, 500],
      ['ValidationError', IntegrationError, 400]
    ])('perform throws when the single entry fails with %s', async (code, errorClass, status) => {
      mockSend.mockResolvedValueOnce({ FailedEntryCount: 1, Entries: [{ ErrorCode: code, ErrorMessage: 'failed' }] })
      const testDestination = createTestIntegration(Definition)
      const error = await testDestination
        .testAction('send', { event: createTestEvent({ type: 'track' }), settings, mapping, features: flagOn })
        .catch((e) => e)
      expect(error).toBeInstanceOf(errorClass)
      expect(error.status).toBe(status)
      expect(error.message).toBe(`Entry failed with ${code}. Message: failed`)
    })

    it('perform does not throw on a failed entry with flag off', async () => {
      mockSend.mockResolvedValueOnce({
        FailedEntryCount: 1,
        Entries: [{ ErrorCode: 'ThrottlingException', ErrorMessage: 'Rate exceeded' }]
      })
      const testDestination = createTestIntegration(Definition)
      await expect(
        testDestination.testAction('send', { event: createTestEvent({ type: 'track' }), settings, mapping })
      ).resolves.toBeDefined()
    })

    it('performBatch passes features to send', async () => {
      mockSend.mockResolvedValueOnce({
        FailedEntryCount: 1,
        Entries: [{ ErrorCode: 'ThrottlingException', ErrorMessage: 'Rate exceeded' }]
      })
      const testDestination = createTestIntegration(Definition)
      await testDestination.testBatchAction('send', {
        events: [createTestEvent({ type: 'track' })],
        settings,
        mapping,
        features: flagOn
      })
      expect(testDestination.results[0].multistatus?.[0]).toMatchObject({ status: 429 })
    })
  })

  describe('client reuse', () => {
    it('creates one EventBridgeClient per region', async () => {
      mockSend.mockResolvedValue({ FailedEntryCount: 0, Entries: [{ EventId: '1' }] })
      const clientMock = EventBridgeClient as unknown as jest.Mock
      const before = clientMock.mock.calls.length

      await send([payload], { ...settings, region: 'eu-west-1' }, hookOutputs)
      await send([payload], { ...settings, region: 'eu-west-1' }, hookOutputs)
      await send([payload], { ...settings, region: 'ap-south-1' }, hookOutputs)

      const regions = clientMock.mock.calls.slice(before).map(([config]) => config.region)
      expect(regions).toEqual(['eu-west-1', 'ap-south-1'])
    })
  })
})
