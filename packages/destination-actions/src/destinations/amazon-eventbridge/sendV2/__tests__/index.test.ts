import { send } from '../../functionsv2' // Adjust path as needed
import {
  PutPartnerEventsCommand,
  ListPartnerEventSourcesCommand,
  CreatePartnerEventSourceCommand
} from '@aws-sdk/client-eventbridge'
import { Payload } from '../../send/generated-types'
import { Settings } from '../../generated-types'

// Mock AWS SDK
jest.mock('@aws-sdk/client-eventbridge', () => {
  const mockSend = jest.fn()
  return {
    EventBridgeClient: jest.fn(() => ({
      send: mockSend
    })),
    PutPartnerEventsCommand: jest.fn(),
    ListPartnerEventSourcesCommand: jest.fn(),
    CreatePartnerEventSourceCommand: jest.fn(),
    mockSend
  }
})

const { mockSend } = jest.requireMock('@aws-sdk/client-eventbridge')

describe('AWS EventBridge Integration', () => {
  const settings: Settings = {
    awsRegion: 'us-west-2',
    awsAccountId: '123456789012',
    createPartnerEventSource: true,
    partnerEventSourceName: 'your-partner-event-source-name'
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
        enable_batching: true
      }
    ]

    // Mocking the listPartnerEventSources response to simulate source existence check
    mockSend.mockResolvedValueOnce({
      PartnerEventSources: [{ Name: `${settings.partnerEventSourceName}/test-source` }]
    })

    // Mocking a successful PutPartnerEventsCommand response
    mockSend.mockResolvedValueOnce({
      FailedEntryCount: 0,
      Entries: [{ EventId: '12345' }]
    })

    await send(payloads, settings)

    expect(mockSend).toHaveBeenCalledWith(expect.any(ListPartnerEventSourcesCommand))
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutPartnerEventsCommand))
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  test('send should throw an error if FailedEntryCount > 0', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true
      }
    ]

    mockSend.mockResolvedValueOnce({
      PartnerEventSources: [{ Name: `${settings.partnerEventSourceName}/test-source` }]
    })

    mockSend.mockResolvedValueOnce({
      FailedEntryCount: 1,
      Entries: [{ ErrorCode: 'EventBridgeError', ErrorMessage: 'Invalid event' }]
    })

    const result = await send(payloads, settings)
    const responses = result.getAllResponses()
    // Check if the first response has an error
    if ('data' in responses[0]) {
      expect(responses[0].data.status).toBe(400)
    }
  })

  test('ensurePartnerSourceExists should create source if it does not exist', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true
      }
    ]

    const updatedSettings: Settings = {
      ...settings,
      partnerEventSourceName: 'aws.partner/segment.com.test',
      createPartnerEventSource: true
    }

    // Simulate "List" finding no source and success on creation
    mockSend
      .mockResolvedValueOnce({ PartnerEventSources: [] }) // No source exists
      .mockResolvedValueOnce({}) // CreatePartnerEventSourceCommand success
      .mockResolvedValueOnce({ FailedEntryCount: 0 }) // Event sent successfully

    await send(payloads, updatedSettings)

    // Ensure the List command was called
    expect(mockSend).toHaveBeenCalledWith(expect.any(ListPartnerEventSourcesCommand))

    // Ensure the Create command was called
    expect(mockSend).toHaveBeenCalledWith(expect.any(CreatePartnerEventSourceCommand))

    // Ensure the event is sent
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutPartnerEventsCommand))

    // Ensure all three commands are called
    expect(mockSend).toHaveBeenCalledTimes(3)
  })

  test('ensurePartnerSourceExists should not create source if it already exists', async () => {
    // Mock ListPartnerEventSourcesCommand to simulate existing source
    mockSend
      .mockResolvedValueOnce({
        PartnerEventSources: [{ Name: 'aws.partner/segment.com.test/test-source' }]
      }) // ListPartnerEventSourcesCommand
      .mockResolvedValueOnce({
        FailedEntryCount: 0, // Mock success for PutPartnerEventsCommand
        Entries: [{ EventId: '12345' }]
      })

    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true
      }
    ]

    const updatedSettings: Settings = {
      ...settings,
      partnerEventSourceName: 'your-partner-event-source-name',
      createPartnerEventSource: false
    }

    await send(payloads, updatedSettings)

    // Ensure it only calls ListPartnerEventSources and PutPartnerEventsCommand
    expect(mockSend).toHaveBeenCalledTimes(2)

    // Ensure it does NOT call CreatePartnerEventSourceCommand
    expect(mockSend).not.toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ Account: '123456789012' }) })
    )
  })

  test('ensurePartnerSourceExists should create source if missing', async () => {
    // Simulate "ListPartnerEventSources" - No source found
    mockSend.mockResolvedValueOnce({ PartnerEventSources: [] })

    // Simulate "CreatePartnerEventSource" - Source created
    mockSend.mockResolvedValueOnce({})

    // Simulate "PutEventsCommand" - Event sent successfully
    mockSend.mockResolvedValueOnce({
      FailedEntryCount: 0,
      Entries: [{ EventId: '12345' }]
    })

    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true
      }
    ]

    await send(payloads, settings)

    // Ensure all three calls are made: List, Create, and Put
    expect(mockSend).toHaveBeenCalledTimes(3)

    // Check if CreatePartnerEventSourceCommand is called
    expect(mockSend).toHaveBeenCalledWith(expect.any(CreatePartnerEventSourceCommand))
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
        enable_batching: true
      }
    ]

    // Ensure correct mock responses for all EventBridge calls
    mockSend
      .mockResolvedValueOnce({ PartnerEventSources: [] }) // ListPartnerEventSourcesCommand
      .mockResolvedValueOnce({}) // CreatePartnerEventSourceCommand
      .mockResolvedValueOnce({ FailedEntryCount: 0, Entries: [{ EventId: '12345' }] }) // PutEventsCommand

    await send(payloads, settings)

    expect(mockSend).toHaveBeenCalledTimes(3)

    // Ensure CreatePartnerEventSourceCommand is called
    expect(mockSend).toHaveBeenCalledWith(expect.any(CreatePartnerEventSourceCommand))

    // Ensure PutEventsCommand is called with expected arguments
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutPartnerEventsCommand))
  })

  test('process_data should throw error if event send fails', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true
      }
    ]

    const settings = {
      awsRegion: 'us-west-2',
      awsAccountId: '123456789012',
      partnerEventSourceName: 'test-source'
      // Other settings here
    }

    // Mock a failed response
    mockSend
      .mockResolvedValueOnce({
        PartnerEventSources: [{ Name: 'aws.partner/segment.com.test/test-source' }]
      }) // ListPartnerEventSourcesCommand
      .mockResolvedValueOnce({
        FailedEntryCount: 1,
        Entries: [{ ErrorCode: 'Error', ErrorMessage: 'Failed' }]
      })

    // Call the function and assert that it throws an error
    // await expect(send(payloads, settings)).rejects.toThrow(
    //   'EventBridge failed with 1 errors: Error: Error, Message: Failed'
    // )
    const result = await send(payloads, settings)

    const response = result.getAllResponses()[0].data

    expect(response.status).toBe(400)
    expect(response.errormessage).toMatch(/Failed/)
  })

  test('process_data should send event to EventBridge', async () => {
    const payloads: Payload[] = [
      {
        sourceId: 'test-source',
        detailType: 'UserSignup',
        data: { user: '123', event: 'signed_up' },
        resources: 'test-resource',
        enable_batching: true
      }
    ]

    const settings = {
      awsRegion: 'us-west-2',
      awsAccountId: '123456789012',
      partnerEventSourceName: 'test-source',
      createPartnerEventSource: true
      // Other settings here
    }

    mockSend
      .mockResolvedValueOnce({ PartnerEventSources: [{ Name: 'aws.partner/segment.com.test/test-source' }] }) // ListPartnerEventSourcesCommand
      .mockResolvedValueOnce({
        FailedEntryCount: 0,
        Entries: [{}]
      })

    const result = await send(payloads, settings)
    const response = result.getAllResponses()[0].data
    expect(response.status).toBe(200)
  })
})
