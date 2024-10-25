import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const settings: Settings = { apiKey: 'key' }

const testDestination = createTestIntegration(Destination)

describe('Drip.track', () => {
  it('should identify with default mappings', async () => {
    nock('https://api-staging.getdrip.com').post('/v2/3977335/subscribers').reply(200, {})

    const event = createTestEvent({
      event: 'Custom',
      traits: { email: 'foo@bar.com' },
      properties: { fizz: 'buzz' }
    })

    const responses = await testDestination.testAction('identify', {
      settings: settings,
      event: event,
      useDefaultMappings: true
    })

    const body = {
      email: 'foo@bar.com'
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(JSON.stringify(body))
  })

  // TODO: should identify with mappings

  it('should batch identify with default mappings', async () => {
    nock('https://api-staging.getdrip.com').post('/v2/3977335/subscribers/batches').reply(200, {})

    const event = createTestEvent({
      event: 'Custom',
      traits: { email: 'foo@bar.com' },
      properties: { fizz: 'buzz' }
    })

    const responses = await testDestination.testBatchAction('identify', {
      settings: settings,
      events: [event],
      useDefaultMappings: true
    })

    const body = {
      subscribers: [
        {
          email: 'foo@bar.com'
        }
      ]
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(JSON.stringify(body))
  })

  // TODO: should batch identify with mappings
})
