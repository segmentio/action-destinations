import {
  StateContext,
  Destination,
  DestinationDefinition,
  Logger,
  StatsClient,
  StatsContext,
  TransactionContext
} from '../destination-kit'
import { JSONObject } from '../json-object'
import { SegmentEvent } from '../segment-event'

const destinationCustomAuth: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {
        optional_field: {
          type: 'number',
          label: 'A',
          description: 'A'
        }
      },
      perform: (_request, { payload }) => {
        return ['this is a test', payload]
      }
    }
  }
}

const destinationOAuth2: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: (_request) => {
      return new Promise((resolve, _reject) => {
        setTimeout(() => {
          resolve({ accessToken: 'fresh-token' })
        }, 3)
      })
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {},
      perform: (_request) => {
        return 'this is a test'
      }
    }
  }
}

const destinationWithOptions: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: (_request) => {
      return new Promise((resolve, _reject) => {
        setTimeout(() => {
          resolve({ accessToken: 'fresh-token' })
        }, 3)
      })
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {},
      perform: (_request, { features, statsContext, logger, transactionContext, stateContext }) => {
        return { features, statsContext, logger, transactionContext, stateContext }
      }
    }
  }
}

describe('destination kit', () => {
  describe('event validations', () => {
    test('should return `invalid subscription` when sending an empty subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { apiSecret: 'test_key', subscription: { subscribe: '', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: 'invalid subscription' }])
    })

    test('should return invalid subscription with details when sending an invalid subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { apiSecret: 'test_key', subscription: { subscribe: 'typo', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: "invalid subscription : Cannot read properties of undefined (reading 'type')" }])
    })

    test('should return `not subscribed` when providing an empty event', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = {
        apiSecret: 'test_key',
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      // @ts-ignore needed for replicating empty event at runtime
      const res = await destinationTest.onEvent({}, testSettings)
      expect(res).toEqual([{ output: 'not subscribed' }])
    })

    test('should fail if provided invalid settings', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = {
        apiSecret: undefined,
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      // @ts-expect-error we are missing valid settings on purpose!
      const promise = destinationTest.onEvent(testEvent, testSettings)
      await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The root value is missing the required field 'apiSecret'."`
      )
    })

    test('should succeed if provided with a valid event & settings', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })

    test('should succeed when traits filtering is specified', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        traits: {
          a: 'foo'
        },
        userId: '3456fff',
        type: 'identify'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "identify" and traits.a = "foo"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })

    test('should succeed when property filtering is specified', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { a: 'foo', field_one: 'test input' },
        traits: {
          b: 'foo'
        },
        userId: '3456fff',
        type: 'identify'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "identify" and properties.a = "foo"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })
  })

  describe('payload mapping + validation', () => {
    test('removes empty values from the payload', async () => {
      const destinationTest = new Destination(destinationCustomAuth)

      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }

      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            // Intentionally empty, to get stripped out
            optional_field: ''
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: ['this is a test', {}] }
      ])
    })
  })

  describe('refresh token', () => {
    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = {
        subscription: { subscribe: '', partnerAction: 'customEvent' }
      }
      const oauthData = {
        accessToken: 'test-access-token',
        refreshToken: 'refresh-token',
        clientId: 'test-clientid',
        clientSecret: 'test-clientsecret',
        refreshTokenUrl: 'abc123.xyz'
      }
      try {
        await destinationTest.refreshAccessToken(testSettings, oauthData)
        fail('test should have thrown a NotImplemented error')
      } catch (e: any) {
        expect(e.status).toEqual(501)
        expect(e.message).toEqual('refreshAccessToken is only valid with oauth2 authentication scheme')
        expect(e.code).toEqual('NotImplemented')
      }
    })

    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationOAuth2)
      const testSettings = {
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      const oauthData = {
        accessToken: 'test-access-token',
        refreshToken: 'refresh-token',
        clientId: 'test-clientid',
        clientSecret: 'test-clientsecret',
        refreshTokenUrl: 'abc123.xyz'
      }
      const res = await destinationTest.refreshAccessToken(testSettings, oauthData)

      expect(res).toEqual({ accessToken: 'fresh-token' })
    })
  })

  describe('features', () => {
    test('should not crash when features are passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {
          test_feature: true
        },
        statsContext: {} as StatsContext
      }

      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)

      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: {
            features: eventOptions.features,
            statsContext: {}
          }
        }
      ])
    })
  })

  describe('stats', () => {
    test('should not crash when stats are passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        statsContext: {
          statsClient: {} as StatsClient,
          tags: []
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)

      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: {
            features: {},
            statsContext: eventOptions.statsContext
          }
        }
      ])
    })
  })

  describe('logger', () => {
    test('should not crash when logger is passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {},
        statsContext: {} as StatsContext,
        logger: { name: 'test-integration', level: 'debug' } as Logger
      }
      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: {
            features: {},
            statsContext: {},
            logger: eventOptions.logger
          }
        }
      ])
    })
  })
  describe('transactionContext', () => {
    test('should not crash when transactionContext is passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {},
        statsContext: {} as StatsContext,
        logger: { name: 'test-integration', level: 'debug' } as Logger,
        transactionContext: {
          transaction: { contact_id: '801' },
          setTransaction: (key: string, value: string) => ({ [key]: value })
        } as TransactionContext
      }
      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: {
            features: {},
            statsContext: {},
            logger: eventOptions.logger,
            transactionContext: eventOptions.transactionContext
          }
        }
      ])
    })
  })

  describe('stateContext', () => {
    test('should not crash when stateContext is passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {},
        statsContext: {} as StatsContext,
        logger: { name: 'test-integration', level: 'debug' } as Logger,
        transactionContext: {
          transaction: { contact_id: '801' },
          setTransaction: (key: string, value: string) => ({ [key]: value })
        } as TransactionContext,
        stateContext: {
          getRequestContext: (_key: string, _cb?: (res?: string) => any): any => {},
          setResponseContext: (
            _key: string,
            _value: string,
            _ttl: { hour?: number; minute?: number; second?: number }
          ): void => {}
        } as StateContext
      }
      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: {
            features: {},
            statsContext: {},
            logger: eventOptions.logger,
            transactionContext: eventOptions.transactionContext,
            stateContext: eventOptions.stateContext
          }
        }
      ])
    })
  })
})
