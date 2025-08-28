import {
  EventBridgeClient,
  ListPartnerEventSourcesCommand,
  CreatePartnerEventSourceCommand
} from '@aws-sdk/client-eventbridge'
import { ensurePartnerSource } from '../hooks'
import { getFullSourceName } from '../hooks'
const mockSend = jest.fn()

// Mock AWS SDK **before importing the integration** (important)
jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn(() => ({
    send: mockSend
  })),
  PutPartnerEventsCommand: class {
    constructor(public input: any) {}
  },
  ListPartnerEventSourcesCommand: class {
    input: any
    constructor(input: any) {
      this.input = input
    }
  },
  CreatePartnerEventSourceCommand: class {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
}))

let client: EventBridgeClient

describe('AWS EventBridge Integration', () => {
  afterEach(() => {})

  beforeEach(() => {
    jest.clearAllMocks()
    client = new EventBridgeClient({ region: 'us-east-2' })
  })

  describe('hook function ensureSourceId() should return or create Source ID', () => {
    it('create Source if it does not already exist', async () => {
      mockSend.mockResolvedValueOnce({
        PartnerEventSources: []
      })

      mockSend.mockResolvedValueOnce({})

      await ensurePartnerSource(client, 'accountId1', 'sourceId1')

      expect(mockSend).toHaveBeenCalledWith(expect.any(ListPartnerEventSourcesCommand))
      expect(mockSend).toHaveBeenCalledWith(expect.any(CreatePartnerEventSourceCommand))
      expect(mockSend).toHaveBeenCalledTimes(2)

      const createArg = mockSend.mock.calls[1][0]
      expect(createArg.input).toEqual({ Account: 'accountId1', Name: 'aws.partner/segment.com/sourceId1' })
    })

    it('do not create new Source if it already exists', async () => {
      mockSend.mockResolvedValueOnce({
        PartnerEventSources: [{ SourceId: 'sourceId1' }] // we only check that the array if > 0, so we don't care what's in it
      })

      await ensurePartnerSource(client, 'accountId1', 'sourceId1')

      expect(mockSend).toHaveBeenCalledWith(expect.any(ListPartnerEventSourcesCommand))

      expect(mockSend).toHaveBeenCalledTimes(1)

      const findArg = mockSend.mock.calls[0][0]
      expect(findArg.input).toEqual({ NamePrefix: getFullSourceName('sourceId1') })
    })
  })
})
