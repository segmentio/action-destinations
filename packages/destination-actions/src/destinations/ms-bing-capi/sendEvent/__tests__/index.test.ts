import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { v4 as uuidv4 } from '@lukeed/uuid'
import destination from '../../index'
import { API_URL } from '../../constants'
import { processHashing } from '../../../../lib/hashing-utils'

// Mock dependencies
jest.mock('@lukeed/uuid')
jest.mock('../../../../lib/hashing-utils')

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendEvent'
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>
const mockProcessHashing = processHashing as jest.MockedFunction<typeof processHashing>

const settings = {
  UetTag: 'test-uet-tag',
  ApiToken: 'test-api-token'
}

describe('MS Bing CAPI.sendEvent', () => {
  beforeEach(() => {
    nock.cleanAll()
    mockUuidv4.mockReturnValue('00000000-0000-0000-0000-000000000000')
    mockProcessHashing.mockImplementation((value) => `hashed-${value}`)
  })

  it('should send event with required fields', async () => {
    const event = createTestEvent({
      event: 'Purchase',
      properties: {
        event_type: 'custom'
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (_uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body).toMatchObject({
          data: [
            {
              eventType: 'custom',
              eventName: 'Purchase',
              eventTime: '2023-01-01T12:00:00Z',
              userData: {
                anonymousId: '00000000-0000-0000-0000-000000000000'
              }
            }
          ]
        })
        return [200, { status: 'success' }]
      })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: event.properties?.event_type,
          eventName: event.event,
          eventTime: event.timestamp
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ status: 'success' })
    expect(requestNock.isDone()).toBe(true)
  })

  it('should hash email and phone properly', async () => {
    const event = createTestEvent({
      event: 'Lead',
      properties: {
        event_type: 'custom',
        email: 'test@example.com',
        phone: '+1 (123) 456-7890'
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    mockProcessHashing
      .mockImplementationOnce((value) => `hashed-email-${value}`)
      .mockImplementationOnce((value) => `hashed-phone-${value}`)

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (_uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body).toMatchObject({
          data: [
            {
              eventType: 'custom',
              eventName: 'Lead',
              userData: {
                anonymousId: '00000000-0000-0000-0000-000000000000',
                em: 'hashed-email-test@example.com',
                ph: 'hashed-phone-+1 (123) 456-7890'
              }
            }
          ]
        })
        return [200, { status: 'success' }]
      })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: event.properties?.event_type,
          eventName: event.event,
          eventTime: event.timestamp,
          userData: {
            em: event.properties?.email,
            ph: event.properties?.phone
          }
        }
      }
    })

    expect(requestNock.isDone()).toBe(true)
    expect(mockProcessHashing).toHaveBeenCalledTimes(2)
    expect(mockProcessHashing).toHaveBeenNthCalledWith(1, 'test@example.com', 'sha256', 'hex', expect.any(Function))
    expect(mockProcessHashing).toHaveBeenNthCalledWith(2, '+1 (123) 456-7890', 'sha256', 'hex', expect.any(Function))
  })

  it('should handle API error responses', async () => {
    const event = createTestEvent({
      event: 'Purchase',
      properties: {
        event_type: 'custom'
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(400, { error: 'Invalid request', message: 'Missing required fields' })

    await expect(
      testDestination.testAction(actionSlug, {
        event,
        settings,
        mapping: {
          data: {
            eventType: event.properties?.event_type,
            eventName: event.event,
            eventTime: event.timestamp
          }
        }
      })
    ).rejects.toThrow()
  })

  it('should use provided userData if available', async () => {
    const event = createTestEvent({
      event: 'Purchase',
      properties: {
        event_type: 'custom'
      },
      context: {
        traits: {
          email: 'user@example.com'
        }
      },
      userId: 'user-123',
      timestamp: '2023-01-01T12:00:00Z'
    })

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (_uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body).toMatchObject({
          data: [
            {
              userData: {
                externalId: 'user-123',
                em: 'hashed-user@example.com'
              }
            }
          ]
        })
        return [200, { status: 'success' }]
      })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: event.properties?.event_type,
          eventName: event.event,
          eventTime: event.timestamp,
          userData: {
            externalId: event.userId,
            em: event.context?.traits?.email
          }
        }
      }
    })

    expect(requestNock.isDone()).toBe(true)
  })

  it('should include optional custom data when provided', async () => {
    const event = createTestEvent({
      event: 'Purchase',
      properties: {
        event_type: 'custom',
        currency: 'USD',
        value: 99.99,
        order_id: 'order-123',
        products: [
          {
            id: 'prod-1',
            name: 'Product 1',
            price: 49.99,
            quantity: 2
          }
        ]
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (_uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body).toMatchObject({
          data: [
            {
              eventType: 'custom',
              eventName: 'Purchase',
              eventTime: '2023-01-01T12:00:00Z',
              userData: expect.any(Object),
              currency: 'USD',
              value: 99.99,
              transactionId: 'order-123',
              items: [
                {
                  id: 'prod-1',
                  name: 'Product 1',
                  price: 49.99,
                  quantity: 2
                }
              ]
            }
          ]
        })
        return [200, { status: 'success' }]
      })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: event.properties?.event_type,
          eventName: event.event,
          eventTime: event.timestamp,
          userData: {},
          currency: event.properties?.currency,
          value: event.properties?.value,
          transactionId: event.properties?.order_id,
          items: event.properties?.products
        }
      }
    })

    expect(requestNock.isDone()).toBe(true)
  })

  it('should handle network errors gracefully', async () => {
    const event = createTestEvent({
      event: 'Purchase',
      properties: {
        event_type: 'custom'
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    nock(API_URL).post(`/test-uet-tag/events`).replyWithError({ code: 'ECONNREFUSED', message: 'Connection refused' })

    await expect(
      testDestination.testAction(actionSlug, {
        event,
        settings,
        mapping: {
          data: {
            eventType: event.properties?.event_type,
            eventName: event.event,
            eventTime: event.timestamp
          }
        }
      })
    ).rejects.toThrow()
  })
})
