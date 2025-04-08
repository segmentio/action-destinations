import nock from 'nock'
import {
  SegmentEvent,
  createTestEvent,
  createTestIntegration,
  PayloadValidationError,
  InvalidAuthenticationError
} from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'
import { Errors, API_VERSION } from '../../ortto-client'
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
  context: {
    personas: {
      external_audience_id: 'audience_id'
    }
  }
} as Partial<SegmentEvent>

describe('Ortto.leaveAudience', () => {
  it('should leave audience with default mappings', async () => {
    nock('https://segment-action-api-au.ortto.app')
      .delete(`/${API_VERSION}/audiences/members`)
      .matchHeader('authorization', `Bearer ${settings.api_key}`)
      .reply(200, {})

    const responses = await testDestination.testAction('leaveAudience', {
      settings: settings,
      event: createTestEvent(validPayload),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.method).toBe('DELETE')
  })

  it('should fail with missing ids', async () => {
    const event = createTestEvent({
      userId: '',
      anonymousId: '',
      context: {
        personas: {
          external_audience_id: 'audience_id'
        }
      }
    })
    await expect(
      testDestination.testAction('leaveAudience', {
        settings: settings,
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new PayloadValidationError(Errors.MissingIDs))
  })

  it('should validate API key', async () => {
    const event = createTestEvent(validPayload)
    await expect(
      testDestination.testAction('leaveAudience', {
        settings: {
          api_key: 'invalid api key'
        },
        event: event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new InvalidAuthenticationError(Errors.InvalidAPIKey))
  })
})
