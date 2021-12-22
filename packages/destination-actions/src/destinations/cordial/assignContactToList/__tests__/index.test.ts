import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.assignContactToList', () => {
  it('should work with default mappings', async () => {
    nock(/.*/)
      .post(/\/.*\/contacts/)
      .reply(200, {})
    nock(/.*/)
      .get(/\/.*\/accountlists/)
      .reply(200, [
        {
          id: 123,
          name: 'segment_test-group',
          segment_group_id: 'test group'
        }
      ])

    const event = createTestEvent({ groupId: 'test group' })

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

    const responses = await testDestination.testAction('assignContactToList', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(2)
    expect(responses[1].status).toBe(200)
  })
})
