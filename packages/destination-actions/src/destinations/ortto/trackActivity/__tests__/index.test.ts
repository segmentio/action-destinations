import nock from 'nock'
import {
  createTestEvent,
  createTestIntegration,
  SegmentEvent,
  InvalidAuthenticationError,
  ErrorCodes
} from '@segment/actions-core'
import Destination from '../../index'
import { Errors, API_VERSION, Success } from '../../ortto-client'
import OrttoClient from '../../ortto-client'
import { Settings } from '../../generated-types'
import { TEST_API_KEY } from '../../types'
import { Payload } from '../generated-types'

const testDestination = createTestIntegration(Destination)

const settings: Settings = {
  api_key: TEST_API_KEY
}

const validPayload = {
  timestamp: '2024-01-08T13:52:50.212Z',
  type: 'track',
  userId: 'user_id',
  anonymousId: 'anonymous_id',
  event: 'event',
  messageId: 'message_id',
  properties: {
    arrtibute1: 'value1',
    arrtibute2: 'value2'
  }
} as Partial<SegmentEvent>

describe('Ortto.trackActivity', () => {
  it('should track event with default mappings', async () => {
    nock('https://segment-action-api-au.ortto.app')
      .post(`/${API_VERSION}/track`)
      .matchHeader('authorization', `Bearer ${settings.api_key}`)
      .reply(200, {})

    const responses = await testDestination.testAction('trackActivity', {
      settings: settings,
      event: createTestEvent(validPayload),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.method).toBe('POST')
  })

  it('should reject payloads with empty event name', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_id_1',
        anonymous_id: 'anonymous_id_1',
        message_id: 'message_id_1',
        event: '  '
      },
      {
        user_id: 'user_id_2',
        anonymous_id: 'anonymous_id_2',
        message_id: 'message_id_2',
        event: ''
      }
    ]
    const fakeRequest = jest.fn()
    const client = new OrttoClient(fakeRequest)
    const response = await client.sendActivities(settings, events, 'audience-id')

    const all = response.getAllResponses()
    expect(all.length).toBe(2)
    expect(all[0].value()).toMatchObject({
      status: 400,
      sent: events[0],
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: Errors.MissingEventName
    })
    expect(all[1].value()).toMatchObject({
      status: 400,
      sent: events[1],
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: Errors.MissingEventName
    })
    expect(fakeRequest).not.toHaveBeenCalled()
  })

  it('should ignore events with namespace "ortto.com"', async () => {
    const event: Payload = {
      user_id: 'user_id',
      anonymous_id: 'anonymous_id',
      message_id: 'message_id',
      event: 'Sample Event',
      namespace: 'ortto.com'
    }

    const fakeRequest = jest.fn()
    const client = new OrttoClient(fakeRequest)
    const response = await client.sendActivities(settings, [event], 'audience-id')

    const all = response.getAllResponses()
    expect(all.length).toBe(1)
    expect(all[0].value()).toMatchObject({
      status: 200,
      sent: event,
      body: `Sample Event was originated from ortto.com (Ignored)`
    })
    expect(fakeRequest).not.toHaveBeenCalled()
  })

  it('should validate API key', async () => {
    const event = createTestEvent(validPayload)
    await expect(
      testDestination.testAction('trackActivity', {
        settings: {
          api_key: 'invalid api key'
        },
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new InvalidAuthenticationError(Errors.InvalidAPIKey))
  })

  it('should process a single valid event successfully', async () => {
    const event: Payload = {
      user_id: 'user_id',
      anonymous_id: 'anon_id',
      message_id: 'msg_id',
      event: 'Valid Event'
    }

    const fakeRequest = jest.fn().mockResolvedValue({
      data: {} // no errors in response
    })

    const client = new OrttoClient(fakeRequest)
    const response = await client.sendActivities(settings, [event], 'audience-id')

    const all = response.getAllResponses()
    expect(all.length).toBe(1)
    expect(all[0].value()).toMatchObject({
      ...Success,
      sent: event
    })
    expect(fakeRequest).toHaveBeenCalledTimes(1)
    expect(fakeRequest).toHaveBeenCalledWith(expect.stringContaining('/track'), {
      method: 'POST',
      json: expect.any(Array)
    })
  })

  it('should process a mix of valid and invalid events', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_id_valid',
        event: 'Valid Event'
      },
      {
        user_id: 'user_id_invalid',
        event: ''
      },
      {
        user_id: 'user_id_ignored',
        event: 'Ignored Event',
        namespace: 'ortto.com'
      }
    ]

    const fakeRequest = jest.fn().mockResolvedValue({ data: {} })
    const client = new OrttoClient(fakeRequest)
    const response = await client.sendActivities(settings, events, 'audience-id')

    const all = response.getAllResponses()
    expect(all.length).toBe(3)
    expect(all[0].value()).toMatchObject({
      ...Success,
      sent: events[0]
    })
    expect(all[1].value()).toMatchObject({
      status: 400,
      sent: events[1],
      errormessage: Errors.MissingEventName
    })
    expect(all[2].value()).toMatchObject({
      status: 200,
      sent: events[2],
      body: `Ignored Event was originated from ortto.com (Ignored)`
    })
  })

  it('should handle API-level errors properly', async () => {
    const event: Payload = {
      user_id: 'user_id',
      event: 'Bad Event'
    }

    const fakeRequest = jest.fn().mockResolvedValue({
      data: {
        errors: [
          {
            index: 0,
            status: 422,
            message: 'Unprocessable Entity'
          }
        ]
      }
    })

    const client = new OrttoClient(fakeRequest)
    const response = await client.sendActivities(settings, [event], 'audience-id')

    const all = response.getAllResponses()
    expect(all.length).toBe(1)
    expect(all[0].value()).toMatchObject({
      status: 422,
      errormessage: 'Unprocessable Entity',
      sent: event
    })
  })

  it('should inject audience object when audience_update_mode is set', async () => {
    const event: Payload = {
      user_id: 'user_id',
      event: 'Event with audience',
      audience_update_mode: 'add'
    }

    const fakeRequest = jest.fn().mockResolvedValue({ data: {} })
    const client = new OrttoClient(fakeRequest)
    await client.sendActivities(settings, [event], 'audience-123')

    expect(fakeRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: [
          expect.objectContaining({
            audience: {
              mode: 'add',
              id: 'audience-123'
            }
          })
        ]
      })
    )
  })

  it('should process mix of successful, API error, invalid and ignored events', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_valid_1',
        event: 'Valid Event 1'
      },
      {
        user_id: 'user_invalid',
        event: '' // Invalid event: missing name
      },
      {
        user_id: 'user_ignored',
        event: 'Event to Ignore',
        namespace: 'ortto.com' // Should be ignored
      },
      {
        user_id: 'user_error',
        event: 'Event causing error'
      },
      {
        user_id: 'user_valid_2',
        event: 'Valid Event 2'
      }
    ]

    const fakeRequest = jest.fn().mockResolvedValue({
      data: {
        errors: [
          {
            index: 1,
            status: 422,
            message: 'Failed to process event'
          }
        ]
      }
    })

    const client = new OrttoClient(fakeRequest)
    const response = await client.sendActivities(settings, events, 'audience-xyz')

    const all = response.getAllResponses()
    expect(all.length).toBe(5)

    // Valid event should succeed
    expect(all[0].value()).toMatchObject({
      ...Success,
      sent: events[0]
    })

    // Invalid event should fail
    expect(all[1].value()).toMatchObject({
      status: 400,
      errormessage: Errors.MissingEventName,
      sent: events[1]
    })

    // Ignored event due to namespace
    expect(all[2].value()).toMatchObject({
      status: 200,
      body: expect.stringContaining('Ignored'),
      sent: events[2]
    })

    // API error
    expect(all[3].value()).toMatchObject({
      status: 422,
      errormessage: 'Failed to process event',
      sent: events[3]
    })

    // Valid event should also succeed
    expect(all[4].value()).toMatchObject({
      ...Success,
      sent: events[4]
    })
  })
})
