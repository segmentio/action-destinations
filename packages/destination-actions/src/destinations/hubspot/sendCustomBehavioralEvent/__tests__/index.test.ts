import nock from 'nock'
import { createTestEvent, createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import Destination from '../../index'
import { HUBSPOT_BASE_URL } from '../../properties'

let testDestination = createTestIntegration(Destination)
const settings = {
  portalId: '22596207'
}

beforeEach((done) => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)
  nock.cleanAll()
  done()
})

describe('HubSpot.sendCustomBehavioralEvent', () => {
  test('should succeed in sending event', async () => {
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

    nock(HUBSPOT_BASE_URL).post('/events/v3/send', expectedPayload).reply(204, {})

    return expect(
      testDestination.testAction('sendCustomBehavioralEvent', {
        event,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).resolves.not.toThrowError()
  })

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

  test('should handle flattening of objects', async () => {
    nock(HUBSPOT_BASE_URL).post('/events/v3/send').reply(204, {})

    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: {
        email: 'vep@beri.dz',
        utk: 'abverazffa===1314122f',
        userId: '802',
        city: 'city',
        customPropertyOne: [1, 2, 3, 4, 5],
        customPropertyTwo: {
          a: 1,
          b: 2,
          c: 3
        },
        customPropertyThree: [1, 'two', true, { four: 4 }]
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
        },
        custom_property_1: {
          '@path': '$.properties.customPropertyOne'
        },
        custom_property_2: {
          '@path': '$.properties.customPropertyTwo'
        },
        custom_property_3: {
          '@path': '$.properties.customPropertyThree'
        }
      }
    }

    const responses = await testDestination.testAction('sendCustomBehavioralEvent', {
      event,
      useDefaultMappings: true,
      mapping
    })

    expect(responses).toHaveLength(1)
    expect(responses[0].options.json).toMatchObject({
      properties: {
        custom_property_1: '1;2;3;4;5',
        custom_property_2: '{"a":1,"b":2,"c":3}',
        custom_property_3: '1;two;true;{"four":4}'
      }
    })
  })

  test('should fail when event name does not start with pe{hubId}_ and hubId is configured in settings', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'test_event',
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
        settings,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).rejects.toThrowError(`EventName should begin with pe${settings.portalId}_`)
  })

  test('should fail when event name does not start with pe{hubId}_ and hubId is not configured in settings', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'test_event',
      properties: {
        email: 'vep@beri.dz',
        utk: 'abverazffa===1314122f',
        userId: '802',
        city: 'city'
      }
    })

    settings.portalId = ''

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
        settings,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).rejects.toThrowError(`EventName should begin with pe<hubId>_`)
  })

  test('should succeed when all fields are given', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      timestamp: '2023-07-05T08:28:35.216Z',
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

    nock(HUBSPOT_BASE_URL).post('/events/v3/send', expectedPayload).reply(204, {})

    const responses = await testDestination.testAction('sendCustomBehavioralEvent', {
      event,
      useDefaultMappings: true,
      mapping: mapping
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
    expect(responses[0].options.json).toMatchSnapshot()
  })

  test('should fail when email, utk and objectId is not provided', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: {
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

    nock(HUBSPOT_BASE_URL).post('/events/v3/send', expectedPayload).reply(400, {})

    return expect(
      testDestination.testAction('sendCustomBehavioralEvent', {
        event,
        useDefaultMappings: true,
        mapping: mapping
      })
    ).rejects.toThrowError('One of the following parameters: email, user token, or objectId is required')
  })

  it('One of email, utk or objectId is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'pe22596207_test_event_http',
      properties: {
        utk: 'abverazffa===1314122f',
        city: 'city'
      },
      timestamp: '2023-07-04T10:25:44.778Z'
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

    nock(HUBSPOT_BASE_URL).post('/events/v3/send', expectedPayload).reply(204, {})

    const responses = await testDestination.testAction('sendCustomBehavioralEvent', {
      event,
      useDefaultMappings: true,
      mapping: mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
    expect(responses[0].options.json).toMatchSnapshot()
  })

  it('should dynamically fetch eventNames', async () => {
    nock(HUBSPOT_BASE_URL)
      .get(`/events/v3/event-definitions`)
      .reply(200, {
        total: 2,
        results: [
          {
            labels: {
              singular: 'Viewed Car',
              plural: null
            },
            description: 'An event that fires when visitor views a car listing in the online inventory',
            archived: false,
            primaryObjectId: '0-1',
            trackingType: 'MANUAL',
            name: 'viewed_car',
            id: '22036509',
            fullyQualifiedName: 'pe24288748_viewed_car',
            primaryObject: null,
            createdAt: '2023-12-29T09:19:48.711Z',
            objectTypeId: '6-22036509',
            properties: [],
            associations: [],
            createdUserId: 1229008
          },
          {
            labels: {
              singular: 'Car features',
              plural: null
            },
            description: 'An event that fires when visitor views a car features',
            archived: false,
            primaryObjectId: '0-1',
            trackingType: 'MANUAL',
            name: 'car_features',
            id: '22436142',
            fullyQualifiedName: 'pe24288748_car_features',
            primaryObject: null,
            createdAt: '2024-01-10T12:31:49.368Z',
            objectTypeId: '6-22436142',
            properties: [],
            associations: [],
            createdUserId: 1229008
          }
        ]
      })

    //Dynamically Fetch eventNames
    const eventNameResponses = (await testDestination.executeDynamicField('sendCustomBehavioralEvent', 'eventName', {
      payload: {},
      settings: {}
    })) as DynamicFieldResponse

    expect(eventNameResponses.choices.length).toBe(2)
    expect(eventNameResponses.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'viewed_car',
          value: 'pe24288748_viewed_car'
        }),
        expect.objectContaining({
          label: 'car_features',
          value: 'pe24288748_car_features'
        })
      ])
    )
  })

  it('should return error message and code if dynamic fetch fails', async () => {
    const errorResponse = {
      status: '401',
      message: 'Unable to fetch schemas',
      correlationId: 'da20ed7c-1834-43c8-8d29-c8f65c411bc2',
      category: 'EXPIRED_AUTHENTICATION'
    }
    nock(HUBSPOT_BASE_URL).get(`/events/v3/event-definitions`).reply(401, errorResponse)
    const payload = {}
    const responses = (await testDestination.executeDynamicField('sendCustomBehavioralEvent', 'eventName', {
      payload: payload,
      settings: {}
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBe(0)
    expect(responses.error?.message).toEqual(errorResponse.message)
    expect(responses.error?.code).toEqual(errorResponse.status)
  })
})
