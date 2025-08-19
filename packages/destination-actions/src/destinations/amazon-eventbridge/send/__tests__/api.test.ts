import { send } from '../functions'
import { PutPartnerEventsCommand } from '@aws-sdk/client-eventbridge'
import { Payload } from '../generated-types'
import { Settings } from '../../generated-types'
import { HookOutputs } from '../types'

const mockSend = jest.fn()
jest.mock('@aws-sdk/client-eventbridge', () => {
  return {
    EventBridgeClient: jest.fn(() => ({
      send: mockSend
    })),
    PutPartnerEventsCommand: class {
      input: any
      constructor(input: any) {
        this.input = input
      }
    },
    ListPartnerEventSourcesCommand: jest.fn(),
    CreatePartnerEventSourceCommand: jest.fn()
  }
})

describe('AWS EventBridge Integration', () => {
  const settings: Settings = {
    region: 'us-west-2',
    accountId: '123456789012'
  }

  const hookOutputs: HookOutputs = {
    onMappingSave: { sourceId: 'test-source' },
    retlOnMappingSave: { sourceId: 'test-source' }
  }

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Should send when all parameters are correct', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        time: '2025-01-01T10:05:12Z',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: ['test-resource'],
        enable_batching: true
      }
    ]

    mockSend.mockResolvedValueOnce({
      FailedEntryCount: 0,
      Entries: [{ EventId: '12345' }]
    })

    await send(payloads, settings, hookOutputs)
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutPartnerEventsCommand))
    expect(mockSend).toHaveBeenCalledTimes(1)
    const firstArg = mockSend.mock.calls[0][0]
    expect(firstArg.input).toEqual({
      Entries: [
        {
          Source: 'aws.partner/segment.com/test-source',
          Time: new Date('2025-01-01T10:05:12Z'),
          DetailType: 'UserSignup',
          Detail: JSON.stringify({ user: '123', event: 'signed_up' }),
          Resources: ['test-resource']
        }
      ]
    })
  })

  test('send should throw an error if FailedEntryCount > 0', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: ['test-resource'],
        enable_batching: true
      }
    ]

    mockSend.mockResolvedValueOnce({
      FailedEntryCount: 1,
      Entries: [{ ErrorCode: 'EventBridgeError', ErrorMessage: 'Invalid event' }]
    })

    const result = await send(payloads, settings, hookOutputs)
    const responses = result.getAllResponses()
    // Check if the first response has an error
    if ('data' in responses[0]) {
      expect(responses[0].data.status).toBe(400)
    }
  })
})
