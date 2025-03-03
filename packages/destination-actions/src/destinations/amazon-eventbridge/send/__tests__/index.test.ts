import { send } from '../../functions' // Adjust path as needed
import { EventBridgeClient } from '@aws-sdk/client-eventbridge'
import { Payload } from '../../send/generated-types' // Import the Payload type
import { Settings } from '../../generated-types' // Import the Settings type
import { CreatePartnerEventSourceCommand } from '@aws-sdk/client-eventbridge'

jest.mock('@aws-sdk/client-eventbridge') // Mock AWS SDK

const mockSend = jest.fn()
EventBridgeClient.prototype.send = mockSend

describe('AWS EventBridge Integration', () => {
  const settings = {
    awsRegion: 'us-west-2',
    awsAccountId: '123456789012',
    createPartnerEventSource: true
  }

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('send should call process_data with correct parameters', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true // Add the enable_batching property
      }
    ]

    const updatedSettings: Settings = {
      ...settings,
      partnerEventSourceName: 'your-partner-event-source-name' // Add the partnerEventSourceName property
    }

    await send(payloads, updatedSettings)
    expect(mockSend).toHaveBeenCalled()
  })

  test('process_data should send event to EventBridge', async () => {
    const payloads: Payload[] = [
      // Ensure payloads is of type Payload[]
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true // Add the enable_batching property
      }
    ]

    // Proper mock setup for List and Put commands
    mockSend
      .mockResolvedValueOnce({ PartnerEventSources: [] }) // Simulate "List" finding no source
      .mockResolvedValueOnce({}) // Simulate successful event send

    const updatedSettings: Settings = {
      ...settings,
      partnerEventSourceName: 'aws.partner/segment.com.test', // Add the partnerEventSourceName property
      createPartnerEventSource: true // Ensure this is enabled
    }

    await send(payloads, updatedSettings)

    expect(mockSend).toHaveBeenCalledWith(expect.any(Object))
    expect(mockSend).toHaveBeenCalledTimes(3) // One for List, one for Put
  })

  test('ensurePartnerSourceExists should not create source if it already exists', async () => {
    mockSend.mockResolvedValueOnce({
      PartnerEventSources: [{ Name: 'aws.partner/segment.com.test/test-source' }]
    })

    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true // Add the enable_batching property
      }
    ]

    const updatedSettings: Settings = {
      ...settings,
      partnerEventSourceName: 'your-partner-event-source-name', // Add the partnerEventSourceName property
      createPartnerEventSource: false // Ensure this is disabled
    }

    await send(payloads, updatedSettings)
    expect(mockSend).toHaveBeenCalledTimes(2) // Only ListPartnerEventSources
  })

  test('ensurePartnerSourceExists should create source if missing', async () => {
    const mockSend = jest.spyOn(EventBridgeClient.prototype, 'send')
    mockSend
      .mockResolvedValueOnce({ PartnerEventSources: [] } as never) // First call: No sources exist
      .mockResolvedValueOnce({} as never) // Second call: CreatePartnerEventSource

    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true // Add the enable_batching property
      }
    ]

    const updatedSettings: Settings = {
      ...settings,
      partnerEventSourceName: 'your-partner-event-source-name', // Add the partnerEventSourceName property
      createPartnerEventSource: true // Ensure this is enabled
    }

    await send(payloads, updatedSettings)

    expect(mockSend).toHaveBeenCalledTimes(3)
  })

  test('should throw error if partner source is missing and createPartnerEventSource is false', async () => {
    mockSend.mockResolvedValueOnce({ PartnerEventSources: [] })

    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true // Add the enable_batching property
      }
    ]

    await expect(
      send(payloads, {
        ...settings,
        createPartnerEventSource: false,
        partnerEventSourceName: 'aws.partner/segment.com.test'
      })
    ).rejects.toThrow('Partner Event Source aws.partner/segment.com.test/test-source does not exist.')
  })

  test('create_partner_source should send correct request', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true // Add the enable_batching property
      }
    ]

    mockSend.mockResolvedValueOnce({})

    const updatedSettings: Settings = {
      ...settings,
      partnerEventSourceName: 'your-partner-event-source-name', // Add the partnerEventSourceName property
      createPartnerEventSource: true // Ensure this is enabled
    }

    await send(payloads, updatedSettings)

    expect(mockSend).toHaveBeenCalledWith(expect.any(CreatePartnerEventSourceCommand))
  })
})
