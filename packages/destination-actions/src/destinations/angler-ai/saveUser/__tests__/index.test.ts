import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { baseURL, customersEndpoint } from '../../routes'

const testDestination = createTestIntegration(Destination)

describe('AnglerAi.saveUser', () => {
  const event = createTestEvent()

  const workspaceId = 'test_workspace'
  const accessToken = 'test_token'

  it('should work with default mappings', async () => {
    const endpointURL = customersEndpoint(workspaceId)
    nock(baseURL).post(endpointURL).reply(201)

    const response = await testDestination.testAction('saveUser', {
      event,
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
