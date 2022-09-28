import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Hubspot.sendCustomBehavioralEvent', () => {
  test('it should successful event custom beahvioral event succeed', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: {
        email: 'vvaradu@gmail.com',
        utk: 'abverazffa===1314122f',
        userId: '802',
        city: 'Delhi'
      }
    })
    const expectedPayload = {
      eventName: event.event,
      email: event.properties?.email,
      occurredAt: event.timestamp as string,
      utk: event.properties?.utk,
      objectId: event.properties?.userId,
      properties: {
        hs_city: event.properties?.city
      }
    }
    const mapping = {
      eventName: {
        '@path': '$.event'
      },
      utk: {
        '@path': '$.properties.utk'
      },
      objectId: {
        '@path': '$.properties.userId'
      },
      properties: {
        hs_city: {
          '@path': '$.properties.city'
        }
      }
    }
    nock('https://api.hubapi.com').post('/events/v3/send', expectedPayload).reply(204, {})

    await expect(
      testDestination.testAction('sendCustomBehavioralEvent', {
        event,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).resolves.not.toThrowError()
  })
})
