import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

const heTrackMapping = {
  event_name: {
    '@path': '$.event'
  },
  properties: {
    '@path': '$.properties'
  },
  user_id: {
    '@path': '$.userId'
  },
  account_id: {
    '@path': '$.groupId'
  }
}

describe('Hyperengage.track', () => {
  test('Should throw an error if `event_name` is not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        recency: 'Now'
      },
      event: 'Test_Event'
    })

    await expect(
      testDestination.testAction('track', {
        event,
        mapping: heTrackMapping
      })
    ).rejects.toThrowError()
  })

  test('Should throw an error if workspaceIdentifier or apiKey is not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        recency: 'Now'
      },
      event: 'Test_Event'
    })

    await expect(
      testDestination.testAction('track', {
        event,
        mapping: heTrackMapping,
        settings: {
          workspaceIdentifier: '',
          apiKey: ''
        }
      })
    ).rejects.toThrowError()
  })

  test('Should send an track event to Hyperengage', async () => {
    // Mock: Segment track Call
    nock('https://events.hyperengage.io').post('/api/v1/s2s/event?token=apiKey').reply(200, { success: true })

    const event = createTestEvent({
      type: 'track',
      properties: {
        recency: 'Now'
      },
      event: 'Test_Event'
    })

    const responses = await testDestination.testAction('track', {
      event,
      mapping: heTrackMapping,
      settings: {
        workspaceIdentifier: 'identifier',
        apiKey: 'apiKey'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
  })
})
