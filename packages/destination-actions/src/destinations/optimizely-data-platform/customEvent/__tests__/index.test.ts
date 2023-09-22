import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const productEvent = createTestEvent({
  type: 'track',
  event: 'purchase',
  context: {
    traits: {
      email: 'test.email@test.com'
    }
  },
  properties: {
    order_id: '1234',
    total: 20,
    products: [
      { product_id: '12345', quantity: 2 },
      { product_id: '67890', quantity: 5 }
    ]
  }
})

describe('OptimizelyDataPlatform.trackEvent', () => {
  it('Should fire custom event', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/custom_event').reply(201, {})

    const response = await testDestination.testAction('customEvent', {
      event: productEvent,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      useDefaultMappings: true
    })

    const expectedBody = `"{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\"},\\"action\\":\\"purchase\\",\\"timestamp\\":\\"${productEvent.timestamp}\\",\\"order_id\\":\\"1234\\",\\"total\\":\\"20\\",\\"products\\":[{\\"product_id\\":\\"12345\\",\\"qty\\":2},{\\"product_id\\":\\"67890\\",\\"qty\\":5}]}"`

    expect(response[0].status).toBe(201)
    expect(response[0].options.body).toMatchInlineSnapshot(expectedBody)
  })
})
