import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.addContactToList', () => {
  it('should work with default mappings', async () => {
    nock(/api.cordial.io/).post('/api/segment/addContactToList').reply(200, {})

    const event = createTestEvent({ groupId: 'test group' })

    const mapping = {
      userIdentities: {'channels.email.address': 'contact@example.com'}
    }

    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://api.cordial.io' as const,
      segmentIdKey: 'segment_id'
    }

    await testDestination.testAction('addContactToList', {
      event,
      mapping,
      settings,
      useDefaultMappings: true
    })
  })
})
