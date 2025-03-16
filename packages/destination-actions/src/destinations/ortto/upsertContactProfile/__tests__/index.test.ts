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

  it('should fail with missing ids', async () => {
    const event = createTestEvent({
      userId: '',
      anonymousId: ''
    })
    await expect(
      testDestination.testAction('upsertContactProfile', {
        settings: settings,
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new PayloadValidationError(Errors.MissingIDs))
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
