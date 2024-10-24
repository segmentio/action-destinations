import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const settings: Settings = { apiKey: 'key' }

const testDestination = createTestIntegration(Destination)

describe('Drip.track', () => {
  it('should track events with default mappings', async () => {
    nock('https://api-staging.getdrip.com').post('/v2/3977335/events').reply(200, {})

    const event = createTestEvent({
      event: 'Custom',
      traits: { email: 'foo@bar.com' },
      properties: { fizz: 'buzz' }
    })

    const responses = await testDestination.testAction('track', {
      settings: settings,
      event: event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toContain('Custom')
    expect(responses[0].options.body).toContain('foo@bar.com')
    expect(responses[0].options.body).toContain('buzz')
    // TODO: not-match cases?
  })

  it('should track events with default mappings', async () => {
    nock('https://api-staging.getdrip.com').post('/v2/3977335/events').reply(200, {})

    const event = createTestEvent({
      event: 'Custom',
      traits: { properties: { fizz: 'buzz' } },
      properties: { email: 'foo@bar.com', action: 'Custom' }
    })

    const responses = await testDestination.testAction('track', {
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

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toContain('Custom')
    expect(responses[0].options.body).toContain('foo@bar.com')
    expect(responses[0].options.body).toContain('buzz')
    // TODO: not-match cases?
  })
})
