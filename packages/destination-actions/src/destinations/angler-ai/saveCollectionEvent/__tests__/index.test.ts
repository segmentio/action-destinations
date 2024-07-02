import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { baseURL, eventsEndpoint } from '../../routes'

const testDestination = createTestIntegration(Destination)

describe('AnglerAi.saveCollectionEvent', () => {
  const event = createTestEvent()

  const workspaceId = 'test_workspace'
  const accessToken = 'test_token'

  it('should work with default mappings', async () => {
    const endpointURL = eventsEndpoint(workspaceId)
    nock(baseURL).post(endpointURL).reply(201)

    const response = await testDestination.testAction('saveCollectionEvent', {
      event: {
        ...event,
        event: 'collection_viewed'
      },
      useDefaultMappings: true,
      settings: {
        workspaceId,
        accessToken
      }
    })
    expect(response.length).toBe(1)
    expect(new URL(response[0].url).pathname).toBe(endpointURL)
    expect(response[0].status).toBe(201)
  })
})
