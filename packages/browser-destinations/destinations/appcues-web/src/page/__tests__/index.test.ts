import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import AppcuesDestination, { destination } from '../../index'
import { Appcues } from '../../types'

describe('Appcues.page', () => {
  const settings = {
    accountID: 'test-account-id',
    region: 'US' as const,
    enableURLDetection: true
  }

  let mockAppcues: Appcues
  let event: any

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockAppcues = {
        track: jest.fn(),
        identify: jest.fn(),
        group: jest.fn(),
        page: jest.fn()
      }
      return Promise.resolve(mockAppcues)
    })
  })

  test('page() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'page',
        name: 'Page',
        enabled: true,
        subscribe: 'type = "page"',
        mapping: {}
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'page',
      anonymousId: 'anonymous-id-123',
      userId: 'user-123',
      properties: {
        url: 'https://example.com/home',
        path: '/home',
        title: 'Home Page'
      }
    })

    const [pageEvent] = await AppcuesDestination({
      ...settings,
      subscriptions
    })
    event = pageEvent

    await event.load(Context.system(), {} as Analytics)
    await event.page?.(context)

    expect(mockAppcues.page).toHaveBeenCalled()
  })
})
