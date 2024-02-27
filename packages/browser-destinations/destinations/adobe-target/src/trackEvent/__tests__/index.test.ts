import { Analytics, Context } from '@segment/analytics-next'
import adobeTarget, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

describe('Adobe Target Web', () => {
  describe('#track', () => {
    test('Calls track to track events', async () => {
      const subscriptions: Subscription[] = [
        {
          partnerAction: 'trackEvent',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            userId: {
              '@if': {
                exists: {
                  '@path': '$.userId'
                },
                then: {
                  '@path': '$.userId'
                },
                else: {
                  '@path': '$.anonymousId'
                }
              }
            },
            type: {
              '@path': '$.event'
            },
            properties: {
              '@path': '$.properties'
            }
          }
        }
      ]

      const targetSettings = {
        client_code: 'segmentexchangepartn',
        admin_number: '10',
        version: '2.8.0',
        cookie_domain: 'segment.com',
        mbox_name: 'target-global-mbox'
      }

      const trackParams = {
        properties: {
          purchase_amount: 42.21,
          currency: 'USD',
          item: 'Shirt'
        }
      }

      const [event] = await adobeTarget({
        ...targetSettings,
        subscriptions
      })

      jest.spyOn(destination, 'initialize')

      destination.actions.trackEvent.perform = jest.fn(destination.actions.trackEvent.perform)

      await event.load(Context.system(), {} as Analytics)
      expect(destination.initialize).toHaveBeenCalled()

      await event.track?.(
        new Context({
          event: 'purchase',
          type: 'track',
          ...trackParams
        })
      )

      expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          payload: {
            ...trackParams,
            type: 'purchase'
          }
        })
      )
    })
  })
})
