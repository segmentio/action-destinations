import { Destination, DestinationDefinition } from '../destination-kit'
import { JSONObject } from '../json-object'
import { SegmentEvent } from '../segment-event'

const destinationCustomAuth: DestinationDefinition<JSONObject> = {
  name: 'Google Analytics 4',
  authentication: {
    scheme: 'custom',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (_request) => {
      return true
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

const destinationOAuth2: DestinationDefinition<JSONObject> = {
  name: 'Google Analytics 4',
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
    testAuthentication: (_request) => {
      return true
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

describe('destination kit', () => {
  describe('event validations', () => {
    test('should return `invalid subscription` when sending an empty subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { subscription: { subscribe: '', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: 'invalid subscription' }])
    })

    test('should return invalid subscription with details when sending an invalid subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { subscription: { subscribe: 'typo', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: "invalid subscription : Cannot read property 'type' of undefined" }])
    })

    test('should return `not subscribed` when providing an empty event', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = { subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' } }
      // @ts-ignore needed for replicating empty event at runtime
      const res = await destinationTest.onEvent({}, testSettings)
      expect(res).toEqual([{ output: 'not subscribed' }])
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
        { output: 'MapInput completed', error: null },
        { output: 'Validate completed', error: null },
        { output: 'this is a test', error: null }
      ])
    })
  })

  describe('refresh token', () => {
    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = { subscription: { subscribe: '', partnerAction: 'customEvent' } }
      try {
        await destinationTest.refreshAccessToken(testSettings, {
          clientId: 'test-clientid',
          clientSecret: 'test-clientsecret'
        })
        fail('test should have thrown a NotImplemented error')
      } catch (e) {
        expect(e.status).toEqual(501)
        expect(e.message).toEqual('refreshAccessToken is only valid with oauth2 authentication scheme')
        expect(e.code).toEqual('NotImplemented')
      }
    })

    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationOAuth2)
      const testSettings = { subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' } }
      const res = await destinationTest.refreshAccessToken(testSettings, {
        clientId: 'test-clientid',
        clientSecret: 'test-clientsecret'
      })

      expect(res).toEqual({ accessToken: 'fresh-token' })
    })
  })
})
