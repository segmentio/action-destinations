import { Subscription } from '@segment/browser-destination-runtime'
import { Analytics, Context } from '@segment/analytics-next'
import TikTokPixelDestination, { destination } from '../../index'
import { TikTokPixel } from '../../types'

const settings = {
  pixelCode: '1234'
}

describe('Src.identify', () => {
  // TODO: Test your action
  let mockTtp: TikTokPixel
  let identifyEvent: any

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockTtp = {
        page: jest.fn(),
        identify: jest.fn(),
        track: jest.fn(),
        instance: jest.fn()
      }
      return Promise.resolve(mockTtp)
    })
  })

  test('map PII data for ttq.identify()', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identify',
        name: 'Identify user',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          messageId: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          userId: {
            '@path': '$.userId'
          },
          groupId: {
            '@path': '$.groupId'
          },
          traits: {
            '@path': '$.traits'
          },
          context: {
            '@path': '$.context'
          }
        }
      }
    ]

    const [event] = await TikTokPixelDestination({
      ...settings,
      subscriptions
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.identify, 'perform')

    await event.identify?.(
      new Context({
        type: 'identify',
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        anonymousId: 'anonymousId',
        userId: 'userId',
        traits: {
          phone: '+12345678900',
          email: 'test@test.com',
          first_name: 'First Name',
          last_name: 'Last Name',
          address: {
            city: 'New York',
            country: 'U.S.A.',
            postalCode: '11111',
            state: 'NY'
          }
        },
        context: {
          ip: '1.2.3.4'
        }
      })
    )

    expect(mockTtp.identify).toHaveBeenCalledWith({
      email: 'test@test.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      city: 'newyork',
      state: 'ny',
      country: 'usa',
      zip_code: '11111'
    })
  })

})
