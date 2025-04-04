import nock from 'nock'
import {
  createTestEvent,
  createTestIntegration,
  SegmentEvent,
  PayloadValidationError,
  InvalidAuthenticationError
} from '@segment/actions-core'
import Destination from '../../index'
import { Errors, API_VERSION } from '../../ortto-client'
import { Settings } from '../../generated-types'
import { TEST_API_KEY } from '../../utils'

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

  it('should fail with missing ids', async () => {
    const event = createTestEvent({
      userId: '',
      anonymousId: ''
    })
    await expect(
      testDestination.testAction('trackActivity', {
        settings: settings,
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new PayloadValidationError(Errors.MissingIDs))
  })

  it('should fail with empty event name', async () => {
    const event = createTestEvent({
      userId: 'user_id',
      anonymousId: 'anonymous_id',
      messageId: 'message_id',
      event: '  '
    })
    await expect(
      testDestination.testAction('trackActivity', {
        settings: settings,
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new PayloadValidationError(Errors.MissingEventName))
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

  it('should not track ortto activities', async () => {
    const orttoTrackEvent = {
      timestamp: '2024-01-08T13:52:50.212Z',
      type: 'track',
      userId: 'user_id',
      anonymousId: 'anonymous_id',
      event: 'event',
      messageId: 'message_id',
      properties: {
        arrtibute1: 'value1',
        arrtibute2: 'value2'
      },
      context: {
        app: {
          namespace: 'ortto.com'
        }
      }
    } as Partial<SegmentEvent>

    const responses = await testDestination.testAction('trackActivity', {
      settings: settings,
      event: createTestEvent(orttoTrackEvent),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(0)
  })
})
