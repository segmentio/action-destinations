import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import pendoDestination, { destination } from '../../index'
import { PendoSDK } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'page',
    name: 'Page Load Event',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: {
      url: {
        '@path': '$.context.page.url'
      }
    }
  }
]

describe('Pendo.pageLoad', () => {
  const settings = {
    apiKey: 'abc123',
    setVisitorIdOnLoad: 'disabled',
    region: 'io'
  }

  let mockPendo: PendoSDK
  let pageAction: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [pageLoadEvent] = await pendoDestination({
      ...settings,
      subscriptions
    })
    pageAction = pageLoadEvent

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockPendo = {
        initialize: jest.fn(),
        isReady: jest.fn(),
        track: jest.fn(),
        pageLoad: jest.fn(),
        identify: jest.fn(),
        flushNow: jest.fn()
      }
      return Promise.resolve(mockPendo)
    })
    await pageAction.load(Context.system(), {} as Analytics)
  })

  test('calls the pendo Client pageLoad() function', async () => {
    const context = new Context({
      type: 'page',
      context: {
        page: {
          url: 'https://example.com'
        }
      }
    })
    await pageAction.page?.(context)
    expect(mockPendo.pageLoad).toHaveBeenCalledWith('https://example.com')
  })
})
