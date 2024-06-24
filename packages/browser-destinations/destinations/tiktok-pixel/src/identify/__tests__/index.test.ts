import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import TikTokDestination, { destination } from '../../index'
import { TikTokPixel } from '../../types'

describe('TikTokPixel.reportWebEvent', () => {
  const settings = {
    pixelCode: '1234',
    useExistingPixel: false
  }

  let mockTtp: TikTokPixel
  let reportWebEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockTtp = {
        page: jest.fn(),
        identify: jest.fn(),
        track: jest.fn(),
        instance: jest.fn(() => mockTtp)
      }
      return Promise.resolve(mockTtp)
    })
  })

  test('fires identify with PII', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identify',
        name: 'Identify',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.traits.phone'
          },
          email: {
            '@path': '$.traits.email'
          },
          last_name: {
            '@path': '$.traits.last_name'
          },
          first_name: {
            '@path': '$.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.traits.address.city'
            },
            state: {
              '@path': '$.traits.address.state'
            },
            country: {
              '@path': '$.traits.address.country'
            }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'identify',
      anonymousId: 'anonymousId',
      userId: 'userId',
      traits: {
        last_name: 'lastName',
        first_name: 'firstName',
        email: 'aaa@aaa.com',
        phone: '+12345678900',
        address: {
          city: 'city',
          state: 'state',
          country: 'country'
        }
      }
    })

    const [identifyEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = identifyEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.identify?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
  })
})
