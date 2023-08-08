import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'
import { endpoints } from '../../util'

const testDestination = createTestIntegration(Destination)
const GAMEBALL_API_KEY = 'test_api_key'
const GAMEBALL_SECRET_KEY = 'test_secret_key'

describe('actions-gameball.trackOrder', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'TEST_PLAYER',
      event: 'Place Order',
      properties: {
        mobile: '+20100000000',
        email: "example@example.com",
        order_id: "ABCD1234",
        orderDate: "2023-07-27T12:00:00Z",
        subtotal: 50.99,
        total: 55.99,
        totalShipping: 5,
        totalTax: 0.5,
        totalDiscount: 10,
        lineItems: [{
          productId: "P123",
          sku: "SKU123",
          title: "Product 1",
          category: ["Fashion", "Accessories"],
          collection: ["Summer Collection"],
          tags: ["Sale"],
          weight: 0.5,
          vendor: "Vendor 1",
          quantity: 1,
          price: 45.99,
          taxes: 0.49,
          discount: 10
        }],
        discountCodes: ["DISCOUNT123"],
        redeemedAmount: 5,
        holdReference: null,
        guest: false,
        extra: {
          notes: "Special instructions for shipping"
        },
        merchant: {
          uniqueId: "M123",
          name: "Example Merchant"
        },
        branch: {
          uniqueId: "B123",
          name: "Example Branch"
        }
      }
    });

    nock(endpoints.baseApiUrl).post(endpoints.trackOrder).reply(200, {});

    const responses = await testDestination.testAction('trackOrder', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: GAMEBALL_API_KEY,
        secretKey: GAMEBALL_SECRET_KEY
      }
    });
    expect(responses.length).toBe(1);
    expect(responses[0].status).toBe(200);
    expect(responses[0].data).toMatchObject({});
  });
})
