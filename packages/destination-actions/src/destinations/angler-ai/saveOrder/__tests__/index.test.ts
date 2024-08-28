import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'
import { baseURL, ordersEndpoint } from '../../routes'
import { lineItemsEndpoint } from './../../routes'

const testDestination = createTestIntegration(Destination)

describe('AnglerAi.saveOrder', () => {
  const event = createTestEvent({
    properties: { order_id: 'test_order_id', products: [{ product_id: 'test_product_id', quantity: 1 }] }
  })

  const workspaceId = 'test_workspace'
  const accessToken = 'test_token'

  it('should work with default mappings', async () => {
    const ordersEndpointURL = ordersEndpoint(workspaceId)
    const lineItemsEndpointURL = lineItemsEndpoint(workspaceId)

    nock(baseURL).post(ordersEndpointURL).reply(201)
    nock(baseURL).post(lineItemsEndpointURL).reply(201)

    const response = await testDestination.testAction('saveOrder', {
      event,
      useDefaultMappings: true,
      settings: {
        workspaceId,
        accessToken
      }
    })

    expect(response.length).toBe(2)
    expect(new URL(response[0].url).pathname).toBe(lineItemsEndpointURL)
    expect(response[0].status).toBe(201)
    expect(new URL(response[1].url).pathname).toBe(ordersEndpointURL)
    expect(response[1].status).toBe(201)
  })
})
