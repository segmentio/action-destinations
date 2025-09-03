import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { v4 as uuidv4 } from '@lukeed/uuid'
import destination from '../../index'
import { API_URL } from '../../constants'
import { processHashing } from '../../../../lib/hashing-utils'

jest.mock('@lukeed/uuid')
jest.mock('../../../../lib/hashing-utils')

const testDestination = createTestIntegration(destination)
const actionSlug = 'pageLoad'
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>
const mockProcessHashing = processHashing as jest.MockedFunction<typeof processHashing>

const settings = {
  UetTag: 'test-uet-tag',
  ApiToken: 'test-api-token'
}

describe('MS Bing CAPI.pageLoad - additional tests', () => {
  beforeEach(() => {
    nock.cleanAll()
    mockUuidv4.mockReturnValue('00000000-0000-0000-0000-000000000000')
    mockProcessHashing.mockImplementation((value) => `hashed-${value}`)
  })

  it('should not include optional fields when not provided', async () => {
    const event = createTestEvent({
      type: 'page',
      context: {
        page: {
          url: 'https://example.com'
        }
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body.data[0].pageTitle).toBeUndefined()
        expect(body.data[0].referrerUrl).toBeUndefined()
        expect(body.data[0].keywords).toBeUndefined()
        expect(body.data[0].pageLoadId).toBeUndefined()
        expect(body.data[0].pageType).toBeUndefined()
        return [200, { status: 'success' }]
      })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: 'pageLoad',
          eventTime: event.timestamp,
          eventSourceUrl: event.context.page.url
        }
      }
    })

    expect(requestNock.isDone()).toBe(true)
  })

  it('should handle missing anonymousId gracefully', async () => {
    const event = createTestEvent({
      type: 'page',
      context: {
        page: {
          url: 'https://example.com'
        }
      },
      timestamp: '2023-01-01T12:00:00Z'
    })
    delete event.anonymousId

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body.data[0].userData.anonymousId).toBe('00000000-0000-0000-0000-000000000000')
        return [200, { status: 'success' }]
      })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: 'pageLoad',
          eventTime: event.timestamp,
          eventSourceUrl: event.context.page.url
        }
      }
    })

    expect(requestNock.isDone()).toBe(true)
  })

  it('should not hash undefined email or phone', async () => {
    const event = createTestEvent({
      type: 'page',
      context: {
        page: {
          url: 'https://example.com'
        },
        traits: {
          email: undefined,
          phone: undefined
        }
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body.data[0].userData.em).toBeUndefined()
        expect(body.data[0].userData.ph).toBeUndefined()
        return [200, { status: 'success' }]
      })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: 'pageLoad',
          eventTime: event.timestamp,
          eventSourceUrl: event.context.page.url,
          userData: {
            em: event.context.traits?.email,
            ph: event.context.traits?.phone
          }
        }
      }
    })

    expect(requestNock.isDone()).toBe(true)
    expect(mockProcessHashing).not.toHaveBeenCalled()
  })

  it('should send custom userData fields if provided', async () => {
    const event = createTestEvent({
      type: 'page',
      context: {
        page: {
          url: 'https://example.com'
        }
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    // const customUserData = {
    //   customField: 'customValue'
    // }

    const requestNock = nock(API_URL)
      .post(`/test-uet-tag/events`)
      .reply(function (uri, requestBody) {
        const body = JSON.parse(JSON.stringify(requestBody))
        expect(body.data[0].userData.customField).toBe('customValue')
        return [200, { status: 'success' }]
      })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {}
      }
    })

    expect(requestNock.isDone()).toBe(true)
  })

  it('should handle empty mapping gracefully', async () => {
    const event = createTestEvent({
      type: 'page',
      context: {
        page: {
          url: 'https://example.com'
        }
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event,
        settings,
        mapping: {}
      })
    ).rejects.toThrow()
  })

  it('should send correct headers with API token', async () => {
    const event = createTestEvent({
      type: 'page',
      context: {
        page: {
          url: 'https://example.com'
        }
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    const requestNock = nock(API_URL, {
      reqheaders: {
        Authorization: `Bearer ${settings.ApiToken}`
      }
    })
      .post(`/test-uet-tag/events`)
      .reply(200, { status: 'success' })

    await testDestination.testAction(actionSlug, {
      event,
      settings,
      mapping: {
        data: {
          eventType: 'pageLoad',
          eventTime: event.timestamp,
          eventSourceUrl: event.context.page.url
        }
      }
    })

    expect(requestNock.isDone()).toBe(true)
  })

  it('should not send request if event type is not page', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        page: {
          url: 'https://example.com'
        }
      },
      timestamp: '2023-01-01T12:00:00Z'
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event,
        settings,
        mapping: {
          eventType: 'pageLoad'
        }
      })
    ).rejects.toThrow()
  })
})
