import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.upsertContact', () => {
  it('should work with default mappings', async () => {
    nock(/.*/)
      .post(/\/.*\/contacts/)
      .reply(200, {})
    nock(/.*/)
      .get(/\/.*\/accountcontactattributes/)
      .reply(200, [])

    const event = createTestEvent()

    const mapping = {
      identifyByKey: 'email',
      identifyByValue: {
        '@path': '$.userId'
      }
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const
    }

    const responses = await testDestination.testAction('upsertContact', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(2)
    expect(responses[1].status).toBe(200)
  })
})
