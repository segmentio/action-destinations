import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { HubSpotBaseURL } from '../../properties'

const testDestination = createTestIntegration(Destination)

describe('Hubspot.sendCustomBehavioralEvent', () => {
  test('should succeed', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: {
        email: 'vep@beri.dz',
        utk: 'abverazffa===1314122f',
        userId: '802',
        city: 'city'
      }
    })

    const expectedPayload = {
      eventName: event.event,
      occurredAt: event.timestamp as string,
      utk: event.properties?.utk,
      email: event.properties?.email,
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
    nock(HubSpotBaseURL).post('/events/v3/send', expectedPayload).reply(204, {})

    return expect(
      testDestination.testAction('sendCustomBehavioralEvent', {
        event,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).resolves.not.toThrowError()
  })
  test('should convert property keys to lowercase', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: {
        city: 'city',
        state: 'state'
      }
    })
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
        hs_City: {
          '@path': '$.properties.city'
        },
        HS_STATE: {
          '@path': '$.properties.state'
        }
      }
    }

    const requestValidator = (body: any) =>
      Object.keys(body.properties).filter((key) => key != key.toLowerCase()).length == 0

    nock(HubSpotBaseURL).post('/events/v3/send', requestValidator).reply(204, {})

    return expect(
      testDestination.testAction('sendCustomBehavioralEvent', {
        event,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).resolves.not.toThrowError()
  })
})
