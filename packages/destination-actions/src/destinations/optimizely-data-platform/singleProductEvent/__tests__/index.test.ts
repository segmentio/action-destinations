import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const productEvent = createTestEvent({
  type: 'track',
  event: 'Product Viewed',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'some_audience_name',
      computation_id: 'abc'
    },
    traits: {
      email: 'test.email@test.com'
    }
  },
  traits: {
    email: 'test.email@test.com',
    optimizely_vuid: 'vuid identifier'
  },
  properties: {
    product_id: '12345'
  }
})

describe('OptimizelyDataPlatform.trackEvent', () => {
  it('Should fire single product event', async () => {
    nock('https://function.zaius.app/twilio_segment').post('/product_event').reply(201)

    const response = await testDestination.testAction('singleProductEvent', {
      event: productEvent,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      useDefaultMappings: true
    })

    const expectedBody = `"{\\"type\\":\\"product\\",\\"requestType\\":\\"single\\",\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test.email@test.com\\",\\"optimizely_vuid\\":\\"vuid identifier\\"},\\"action\\":\\"Product Viewed\\",\\"timestamp\\":\\"${productEvent.timestamp}\\",\\"product_id\\":\\"12345\\"}"`;

    expect(response[0].status).toBe(201);
    expect(response[0].options.body).toMatchInlineSnapshot(expectedBody)
  })
})
