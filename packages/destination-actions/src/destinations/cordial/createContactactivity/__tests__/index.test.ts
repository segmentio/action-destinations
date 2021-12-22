import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.createContactactivity', () => {
  it('should work with default mappings', async () => {
    nock(/.*/).post('/v2/contactactivities').reply(200, {})
    const event = createTestEvent()

    const mapping = {
      identifyByKey: 'channels.email.address',
      identifyByValue: {
        '@path': '$.userId'
      }
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const
    }

    const responses = await testDestination.testAction('createContactactivity', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
