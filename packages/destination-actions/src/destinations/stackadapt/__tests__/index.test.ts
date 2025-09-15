import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Definition)
const pixelHostUrl = 'https://tags.srv.stackadapt.com'
const pixelPath = '/saq_pxl'
const mockFirstName = 'John'
const mockLastName = 'Doe'
const mockEmail = 'admin@stackadapt.com'
const mockPhone = '1234567890'
const mockPageTitle = 'Test Page Title'
const mockPageUrl = 'https://www.example.com/example.html'
const mockReferrer = 'https://www.example.net/page.html'
const mockUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
const mockIpAddress = '172.0.0.1'
const mockUtmSource = 'stackadapt'
const mockUserId = 'user-id'
const mockAnonymousId = 'anonymous-id'
const mockPixelId = 'sqHQa3Ob1hiF__2EcY3VZg1'
const mockProduct = {
  price: 10.51,
  quantity: 1,
  category: 'Test Category',
  product_id: 'Test Product Id',
  name: 'Test Product Name'
}
const mockRevenue = 8.72
const mockOrderId = 'Test Order Id'
const mockSingleProductAction = 'Product Added'
const mockMultiProductAction = 'Order Completed'

const expectedProduct = {
  product_price: mockProduct.price,
  product_quantity: mockProduct.quantity,
  product_id: mockProduct.product_id,
  product_category: mockProduct.category,
  product_name: mockProduct.name
}

const defaultExpectedConversionArgs = {
  action: 'Test Event',
  utm_source: mockUtmSource,
  user_id: mockUserId,
  first_name: mockFirstName,
  last_name: mockLastName,
  email: mockEmail,
  phone: mockPhone
}

const defaultExpectedParams = {
  segment_ss: '1',
  event_type: 'identify',
  title: mockPageTitle,
  url: mockPageUrl,
  ref: mockReferrer,
  ip_fwd: mockIpAddress,
  ua_fwd: mockUserAgent,
  uid: mockPixelId,
  args: JSON.stringify(defaultExpectedConversionArgs)
}

const defaultEventPayload: Partial<SegmentEvent> = {
  anonymousId: mockAnonymousId,
  userId: mockUserId,
  type: 'identify',
  traits: {
    first_name: mockFirstName,
    last_name: mockLastName,
    email: mockEmail,
    phone: mockPhone
  },
  context: {
    ip: mockIpAddress,
    userAgent: mockUserAgent,
    page: {
      title: mockPageTitle,
      url: mockPageUrl,
      referrer: mockReferrer
    },
    campaign: {
      name: 'Campaign',
      term: 'Term',
      content: 'Content',
      source: mockUtmSource,
      medium: 'Medium'
    }
  }
}

describe('StackAdapt', () => {
  describe('forwardEvent', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('createOrUpdateContact', {
          settings: { pixelId: mockPixelId }
        })
      } catch (err) {
        expect(err.message).toContain("missing the required field 'userId'.")
      }
    })

    it('Sends event data to pixel endpoint in expected format with expected headers', async () => {
      nock(pixelHostUrl).get(pixelPath).query(true).reply(200, {})

      const event = createTestEvent(defaultEventPayload)
      const responses = await testDestination.testAction('forwardEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          pixelId: mockPixelId
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      const requestParams = Object.fromEntries(new URL(responses[0].request.url).searchParams)
      expect(requestParams).toEqual(defaultExpectedParams)
      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            ],
            "x-forwarded-for": Array [
              "172.0.0.1",
            ],
          },
        }
      `)
    })

    it('Serializes product data for single product event', async () => {
      nock(pixelHostUrl).get(pixelPath).query(true).reply(200, {})

      const eventPayload: Partial<SegmentEvent> = {
        ...defaultEventPayload,
        type: 'track',
        event: mockSingleProductAction,
        properties: {
          revenue: mockRevenue,
          order_id: mockOrderId,
          ...mockProduct
        }
      }
      const event = createTestEvent(eventPayload)
      const responses = await testDestination.testAction('forwardEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          pixelId: mockPixelId
        }
      })

      const expectedParams = {
        ...defaultExpectedParams,
        event_type: 'track',
        args: expect.any(String)
      }

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      const requestParams = Object.fromEntries(new URL(responses[0].request.url).searchParams)
      expect(requestParams).toEqual(expectedParams)
      expect(JSON.parse(requestParams.args)).toEqual({
        ...defaultExpectedConversionArgs,
        action: mockSingleProductAction,
        revenue: mockRevenue,
        order_id: mockOrderId,
        ...expectedProduct
      })
    })

    it('Serializes product data for product array event', async () => {
      nock(pixelHostUrl).get(pixelPath).query(true).reply(200, {})

      const eventPayload: Partial<SegmentEvent> = {
        ...defaultEventPayload,
        type: 'track',
        event: mockMultiProductAction,
        properties: {
          revenue: mockRevenue,
          order_id: mockOrderId,
          products: [mockProduct]
        }
      }
      const event = createTestEvent(eventPayload)
      const responses = await testDestination.testAction('forwardEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          pixelId: mockPixelId
        }
      })

      const expectedParams = {
        ...defaultExpectedParams,
        event_type: 'track',
        args: expect.any(String)
      }

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      const requestParams = Object.fromEntries(new URL(responses[0].request.url).searchParams)
      expect(requestParams).toEqual(expectedParams)
      expect(JSON.parse(requestParams.args)).toEqual({
        ...defaultExpectedConversionArgs,
        action: mockMultiProductAction,
        revenue: mockRevenue,
        order_id: mockOrderId,
        products: [expectedProduct]
      })
    })
  })
})
