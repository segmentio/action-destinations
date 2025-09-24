import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import { PutPartnerEventsCommand } from '@aws-sdk/client-eventbridge'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)

const mockSend = jest.fn()

// Mock AWS SDK **before importing the integration** (important)
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

const payload: Partial<SegmentEvent> = {
  userId: 'userId1',
  anonymousId: 'anonymousId1',
  event: 'Test Event',
  type: 'track',
  context: {
    protocols: {
      sourceId: 'sourceId1'
    }
  },
  timestamp: '2025-01-01T10:05:12Z',
  properties: {
    resources: ['resource1', 'resource2']
  },
  messageId: 'messageid1',
  receivedAt: '2025-08-19T09:47:46.696Z',
  sentAt: '2025-08-19T09:47:46.696Z'
}

const mapping = {
  data: { '@path': '$.' },
  detailType: { '@path': '$.type' },
  sourceId: {
    '@if': {
      exists: { '@path': '$.context.protocols.sourceId' },
      then: { '@path': '$.context.protocols.sourceId' },
      else: { '@path': '$.projectId' }
    }
  },
  resources: { '@path': '$.properties.resources' },
  time: { '@path': '$.timestamp' },
  enable_batching: true,
  batch_size: 10,
  onMappingSave: { outputs: { sourceId: 'sourceId1' } },
  retlOnMappingSave: { outputs: { sourceId: 'sourceId1' } }
}

const settings: Settings = {
  region: 'us-west-2',
  accountId: '123456789012'
}

describe('AWS EventBridge Integration', () => {
  afterEach(() => {})

  beforeEach(() => {
    testDestination = createTestIntegration(Definition)
    jest.clearAllMocks()
  })

  describe('Should send successfully', () => {
    it('when all parameters are correct', async () => {
      mockSend.mockResolvedValueOnce({
        FailedEntryCount: 0,
        Entries: [{ EventId: '12345' }]
      })

      const event = createTestEvent(payload)

      const response = await testDestination.testAction('send', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response).toBeDefined()
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutPartnerEventsCommand))
      expect(mockSend).toHaveBeenCalledTimes(1)

      const firstArg = mockSend.mock.calls[0][0]
      expect(firstArg.input).toEqual({
        Entries: [
          {
            Source: 'aws.partner/segment.com/sourceId1',
            Time: new Date('2025-01-01T10:05:12Z'),
            DetailType: 'track',
            Detail: JSON.stringify({
              anonymousId: 'anonymousId1',
              context: {
                protocols: {
                  sourceId: 'sourceId1'
                }
              },
              event: 'Test Event',
              messageId: 'messageid1',
              properties: {
                resources: ['resource1', 'resource2']
              },
              receivedAt: '2025-08-19T09:47:46.696Z',
              sentAt: '2025-08-19T09:47:46.696Z',
              timestamp: '2025-01-01T10:05:12Z',
              traits: {},
              type: 'track',
              userId: 'userId1'
            }),
            Resources: ['resource1', 'resource2']
          }
        ]
      })
    })
  })

  describe('Should throw an error', () => {
    it('When Source ID missing from hook', async () => {
      mockSend.mockResolvedValueOnce({
        FailedEntryCount: 0,
        Entries: [{ EventId: '12345' }]
      })

      const event = createTestEvent(payload)

      const mappingNoHook = {
        ...mapping,
        onMappingSave: {},
        retlOnMappingSave: {}
      }

      await expect(
        testDestination.testAction('send', {
          event,
          settings,
          useDefaultMappings: true,
          mapping: mappingNoHook
        })
      ).rejects.toThrowError(new Error('Source ID is required. Source ID not found in hook outputs.'))
    })
  })
})
