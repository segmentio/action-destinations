import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, InvalidAuthenticationError } from '@segment/actions-core'
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
  type: 'identify',
  userId: 'user_id',
  anonymousId: 'anonymous_id',
  messageId: 'message_id',
  traits: {
    first_name: 'John',
    last_name: 'Smith'
  }
} as Partial<SegmentEvent>

describe('Ortto.upsertContactProfile', () => {
  it('should upsert profile with default mappings', async () => {
    nock('https://segment-action-api-au.ortto.app')
      .post(`/${API_VERSION}/identify`)
      .matchHeader('authorization', `Bearer ${settings.api_key}`)
      .reply(200, {})

    const responses = await testDestination.testAction('upsertContactProfile', {
      settings: settings,
      event: createTestEvent(validPayload),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.method).toBe('POST')
  })

  it('should inject audience object when audience_update_mode is set', async () => {
    const event: Payload = {
      user_id: 'user_id',
      audience_update_mode: 'add'
    }

    const fakeRequest = jest.fn().mockResolvedValue({ data: {} })
    const client = new OrttoClient(fakeRequest)
    await client.upsertContacts(settings, [event], 'audience-123')

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

  it('should process a single valid event successfully', async () => {
    const event: Payload = {
      user_id: 'user_id',
      anonymous_id: 'anon_id',
      message_id: 'msg_id'
    }

    const fakeRequest = jest.fn().mockResolvedValue({
      data: {} // no errors in response
    })

    const client = new OrttoClient(fakeRequest)
    const response = await client.upsertContacts(settings, [event], 'audience-id')

    const all = response.getAllResponses()
    expect(all.length).toBe(1)
    expect(all[0].value()).toMatchObject({
      ...Success,
      sent: event
    })
    expect(fakeRequest).toHaveBeenCalledTimes(1)
    expect(fakeRequest).toHaveBeenCalledWith(expect.stringContaining('/identify'), {
      method: 'POST',
      json: expect.any(Array)
    })
  })

  it('should process mix of successful, API error, invalid and ignored events', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_valid_1'
      },
      {
        user_id: 'user_error_1'
      },
      {
        user_id: 'user_valid_2'
      },
      {
        user_id: 'user_error_3'
      },
      {
        user_id: 'user_error_4'
      },
      {
        user_id: 'user_valid_2'
      }
    ]

    const fakeRequest = jest.fn().mockResolvedValue({
      data: {
        errors: [
          {
            index: 1,
            status: 422,
            message: 'Failed to process event#1'
          },
          {
            index: 3,
            status: 423,
            message: 'Failed to process event#3'
          },
          {
            index: 4,
            status: 424,
            message: 'Failed to process event#4'
          }
        ]
      }
    })

    const client = new OrttoClient(fakeRequest)
    const response = await client.upsertContacts(settings, events, 'audience-xyz')

    const all = response.getAllResponses()

    expect(all.length).toBe(6)

    expect(all[0].value()).toMatchObject({
      ...Success,
      sent: events[0]
    })
    expect(all[1].value()).toMatchObject({
      status: 422,
      errormessage: 'Failed to process event#1',
      sent: events[1]
    })
    expect(all[2].value()).toMatchObject({
      ...Success,
      sent: events[2]
    })
    expect(all[3].value()).toMatchObject({
      status: 423,
      errormessage: 'Failed to process event#3',
      sent: events[3]
    })
    expect(all[4].value()).toMatchObject({
      status: 424,
      errormessage: 'Failed to process event#4',
      sent: events[4]
    })
    expect(all[5].value()).toMatchObject({
      ...Success,
      sent: events[5]
    })
  })

  it('should validate API key', async () => {
    const event = createTestEvent(validPayload)
    await expect(
      testDestination.testAction('upsertContactProfile', {
        settings: {
          api_key: 'invalid api key'
        },
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new InvalidAuthenticationError(Errors.InvalidAPIKey))
  })
})
