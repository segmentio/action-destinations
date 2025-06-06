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
  type: 'identify',
  userId: 'user_id',
  anonymousId: 'anonymous_id',
  messageId: 'message_id',
  context: {
    personas: {
      external_audience_id: 'audience-id',
      computation_key: 'key',
      computation_class: 'audience'
    }
  },
  properties: {
    computation_key_field: true
  }
} as Partial<SegmentEvent>

describe('OrttoAudiences.syncAudience', () => {
  it('should process event with default mappings', async () => {
    nock('https://segment-action-api-au.ortto.app')
      .put(`/${API_VERSION}/audiences/members`)
      .matchHeader('authorization', `Bearer ${settings.api_key}`)
      .reply(200, {})

    const responses = await testDestination.testAction('syncAudience', {
      settings: settings,
      event: createTestEvent(validPayload),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.method).toBe('PUT')
  })

  it('should validate API key', async () => {
    const event = createTestEvent(validPayload)
    await expect(
      testDestination.testAction('syncAudience', {
        settings: {
          api_key: 'invalid api key'
        },
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new InvalidAuthenticationError(Errors.InvalidAPIKey))
  })

  it('should reject payloads with empty audience id', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_id_1',
        anonymous_id: 'anonymous_id_1',
        message_id: 'message_id_1',
        external_audience_id: '',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      }
    ]
    const fakeRequest = jest.fn()
    const client = new OrttoClient(fakeRequest)
    const response = await client.syncAudience(settings, events)

    const all = response.getAllResponses()
    expect(all.length).toBe(1)
    expect(all[0].value()).toMatchObject({
      status: 400,
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: Errors.MissingAudienceId
    })
    expect(fakeRequest).not.toHaveBeenCalled()
  })

  it('should process valid events successfully', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_id_1',
        anonymous_id: 'anonymous_id_1',
        message_id: 'message_id_1',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        ip: 'ip_address',
        location: {
          city: 'city',
          country: 'country',
          state: 'state',
          post_code: 'post_code'
        },
        traits: {
          computation_key: true,
          first_name: 'John',
          last_name: 'Doe',
          '': 'must be cleaned'
        }
      },
      {
        user_id: 'user_id_2',
        anonymous_id: 'anonymous_id_2',
        message_id: 'message_id_2',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        ip: 'ip_address',
        location: {
          city: 'city',
          country: 'country',
          state: 'state',
          post_code: 'post_code'
        },
        traits: {
          computation_key: false,
          first_name: 'Joe',
          last_name: 'Doe',
          '': 'must be cleaned'
        }
      }
    ]

    const fakeRequest = jest.fn().mockResolvedValue({
      data: {} // no errors in response
    })

    const client = new OrttoClient(fakeRequest)
    const response = await client.syncAudience(settings, events)

    const all = response.getAllResponses()
    expect(all.length).toBe(2)
    expect(all[0].value()).toMatchObject({
      ...Success
    })
    expect(fakeRequest).toHaveBeenCalledTimes(1)
    expect(fakeRequest).toHaveBeenCalledWith(expect.stringContaining('/audiences/members'), {
      method: 'PUT',
      json: [
        expect.objectContaining({
          user_id: 'user_id_1',
          anonymous_id: 'anonymous_id_1',
          message_id: 'message_id_1',
          ip: 'ip_address',
          location: {
            city: 'city',
            country: 'country',
            state: 'state',
            post_code: 'post_code'
          },
          audience: {
            mode: 'add',
            id: 'audience_id'
          },
          traits: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }),
        expect.objectContaining({
          user_id: 'user_id_2',
          anonymous_id: 'anonymous_id_2',
          message_id: 'message_id_2',
          ip: 'ip_address',
          location: {
            city: 'city',
            country: 'country',
            state: 'state',
            post_code: 'post_code'
          },
          audience: {
            mode: 'remove',
            id: 'audience_id'
          },
          traits: {
            first_name: 'Joe',
            last_name: 'Doe'
          }
        })
      ]
    })
  })

  it('should process a mix of valid and invalid events', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_id_1',
        anonymous_id: 'anonymous_id_1',
        message_id: 'message_id_1',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      },
      {
        user_id: 'missing_audience_id',
        anonymous_id: 'anonymous_id_1',
        message_id: 'message_id_1',
        external_audience_id: '',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      },
      {
        user_id: 'user_id_2',
        anonymous_id: 'anonymous_id_2',
        message_id: 'message_id_1',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      }
    ]

    const fakeRequest = jest.fn().mockResolvedValue({ data: {} })
    const client = new OrttoClient(fakeRequest)
    const response = await client.syncAudience(settings, events)

    const all = response.getAllResponses()
    expect(all.length).toBe(3)
    expect(all[0].value()).toMatchObject({
      ...Success
    })
    expect(all[1].value()).toMatchObject({
      status: 400,
      errormessage: Errors.MissingAudienceId
    })
    expect(all[2].value()).toMatchObject({
      ...Success
    })
  })

  it('should handle API-level errors properly', async () => {
    const event: Payload = {
      user_id: 'user_id_1',
      anonymous_id: 'anonymous_id_1',
      message_id: 'message_id_1',
      external_audience_id: 'audience_id',
      computation_key: 'computation_key',
      segment_computation_action: 'audience',
      traits: {
        computation_key: true
      }
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
    const response = await client.syncAudience(settings, [event])

    const all = response.getAllResponses()
    expect(all.length).toBe(1)
    expect(all[0].value()).toMatchObject({
      status: 422,
      errormessage: 'Unprocessable Entity'
    })
  })

  it('should process mix of successful, API error, invalid and ignored events', async () => {
    const events: Payload[] = [
      {
        user_id: 'user_valid_id_1',
        anonymous_id: 'anonymous_valid_id_1',
        message_id: 'message_id_1',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      },
      {
        user_id: 'missing_audience_id_1',
        anonymous_id: 'anonymous_id_1',
        message_id: 'message_id_1',
        external_audience_id: '',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      },
      {
        user_id: 'user_valid_id_2',
        anonymous_id: 'anonymous_valid_id_2',
        message_id: 'message_id_2',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: false
        }
      },
      {
        user_id: 'user_error_id_3',
        anonymous_id: 'anonymous_error_id_3',
        message_id: 'message_id_3',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      },
      {
        user_id: 'user_valid_id_4',
        anonymous_id: 'anonymous_valid_id_4',
        message_id: 'message_id_4',
        external_audience_id: 'audience_id',
        computation_key: 'computation_key',
        segment_computation_action: 'audience',
        traits: {
          computation_key: true
        }
      }
    ]

    const fakeRequest = jest.fn().mockResolvedValue({
      data: {
        errors: [
          {
            index: 2,
            status: 422,
            message: 'Failed to process event'
          }
        ]
      }
    })

    const client = new OrttoClient(fakeRequest)
    const response = await client.syncAudience(settings, events)

    const all = response.getAllResponses()
    expect(all.length).toBe(5)

    // Valid event should succeed
    expect(all[0].value()).toMatchObject({
      ...Success
    })

    // Invalid event should fail
    expect(all[1].value()).toMatchObject({
      status: 400,
      errormessage: Errors.MissingAudienceId
    })

    // Valid event should succeed
    expect(all[2].value()).toMatchObject({
      ...Success
    })

    // API error
    expect(all[3].value()).toMatchObject({
      status: 422,
      errormessage: 'Failed to process event'
    })

    // Valid event should also succeed
    expect(all[4].value()).toMatchObject({
      ...Success
    })
  })
})
