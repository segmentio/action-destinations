import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const settings: Settings = {
  apiKey: 'key',
  endpoint: 'https://api.getdrip.com/v2',
  accountId: '2445926'
}

const testDestination = createTestIntegration(Destination)

describe('Drip.trackEvent', () => {
  it('should track events', async () => {
    nock('https://api.getdrip.com').post('/v2/2445926/events').reply(200, {})

    const event = createTestEvent({
      action: 'Custom',
      email: 'foo@bar.com',
      properties: { fizz: 'buzz' }
    })

    const responses = await testDestination.testAction('trackEvent', {
      settings: settings,
      event: event,
      useDefaultMappings: true
    })

    const body = {
      events: [
        {
          email: 'foo@bar.com',
          action: 'Custom',
          properties: { fizz: 'buzz' }
        }
      ]
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(JSON.stringify(body))
  })

  it('should track events with mappings', async () => {
    nock('https://api.getdrip.com').post('/v2/2445926/events').reply(200, {})

    const event = createTestEvent({
      event: 'Custom',
      traits: { properties: { fizz: 'buzz' } },
      properties: { email: 'foo@bar.com', action: 'Custom' }
    })

    const responses = await testDestination.testAction('trackEvent', {
      settings: settings,
      event: event,
      mapping: {
        action: {
          '@path': '$.properties.action'
        },
        email: {
          '@path': '$.properties.email'
        },
        properties: {
          '@path': '$.traits.properties'
        }
      }
    })

    const body = {
      events: [
        {
          email: 'foo@bar.com',
          action: 'Custom',
          properties: { fizz: 'buzz' }
        }
      ]
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(JSON.stringify(body))
  })
})
