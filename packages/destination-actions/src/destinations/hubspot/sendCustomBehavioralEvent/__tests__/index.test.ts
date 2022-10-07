import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
<<<<<<< HEAD
import { HubSpotBaseURL } from '../../properties'
=======
import { hubSpotBaseURL } from '../../properties'
>>>>>>> CONMAN-199

const testDestination = createTestIntegration(Destination)

describe('Hubspot.sendCustomBehavioralEvent', () => {
<<<<<<< HEAD
  test('should succeed', async () => {
=======
  test('should succeed in sending event', async () => {
>>>>>>> CONMAN-199
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
<<<<<<< HEAD
=======

>>>>>>> CONMAN-199
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
<<<<<<< HEAD
    nock(HubSpotBaseURL).post('/events/v3/send', expectedPayload).reply(204, {})
=======

    nock(hubSpotBaseURL).post('/events/v3/send', expectedPayload).reply(204, {})
>>>>>>> CONMAN-199

    return expect(
      testDestination.testAction('sendCustomBehavioralEvent', {
        event,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).resolves.not.toThrowError()
  })
<<<<<<< HEAD
=======

  test('should fail when event name is missing', async () => {
    const event = createTestEvent({
      type: 'track',
      event: undefined,
      properties: {
        email: 'vep@beri.dz',
        utk: 'abverazffa===1314122f',
        userId: '802',
        city: 'city'
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
        hs_city: {
          '@path': '$.properties.city'
        }
      }
    }

    return expect(
      testDestination.testAction('sendCustomBehavioralEvent', {
        event,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).rejects.toThrowError("The root value is missing the required field 'eventName'.")
  })
>>>>>>> CONMAN-199
})
