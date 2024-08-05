import nock from 'nock'
// import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const DEVICE_ID = 'device-id' // References device.id
const ADVERTISING_ID = 'foobar' // References device.advertisingId
const DEVICE_TYPE = 'ios' // References device.type

describe('Adjust.sendEvent', () => {
  describe('Success cases', () => {
    it('should send an event to Adjust, default mappings, default parameters in Settings', async () => {
      nock('https://s2s.adjust.com').post('/event').reply(200, { status: 'OK' })

      const goodEvent = createTestEvent({
        type: 'track',
        context: {
          device: {
            id: DEVICE_ID,
            advertisingId: ADVERTISING_ID,
            type: DEVICE_TYPE
          },
          library: {
            name: 'analytics-ios',
            version: '4.0.0'
          }
        },
        properties: {
          revenue: 10,
          currency: 'USD'
        }
      })

      const responses = await testDestination.testAction('sendEvent', {
        event: goodEvent,
        useDefaultMappings: true,
        settings: {
          environment: 'sandbox',
          default_app_token: 'app-token',
          default_event_token: 'event-token'
        }
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toBeDefined()
      expect(responses[0].content).toEqual(JSON.stringify({ status: 'OK' }))
    })

    it('should send an event to Adjust, custom mapping, App Token and Event Token mapped as properties', async () => {
      nock('https://s2s.adjust.com').post('/event').reply(200, { status: 'OK' })

      const goodEvent = createTestEvent({
        type: 'track',
        context: {
          device: {
            id: DEVICE_ID,
            advertisingId: ADVERTISING_ID,
            type: DEVICE_TYPE
          },
          library: {
            name: 'analytics-ios',
            version: '4.0.0'
          }
        },
        properties: {
          revenue: 10,
          currency: 'USD',
          appToken: 'app-token',
          eventToken: 'event-token'
        }
      })

      const responses = await testDestination.testAction('sendEvent', {
        event: goodEvent,
        mapping: {
          app_token: {
            '@path': '$.properties.appToken'
          },
          event_token: {
            '@path': '$.properties.eventToken'
          },
          device_id: {
            '@path': '$.context.device.id'
          },
          advertising_id: {
            '@path': '$.context.device.advertisingId'
          },
          device_type: {
            '@path': '$.context.device.type'
          }
        },
        settings: {
          environment: 'sandbox'
        }
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toBeDefined()
      expect(responses[0].content).toEqual(JSON.stringify({ status: 'OK' }))
    })
  })
})
