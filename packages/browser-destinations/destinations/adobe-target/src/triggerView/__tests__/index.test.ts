import { Analytics, Context } from '@segment/analytics-next'
import adobeTarget, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

describe('Adobe Target Web', () => {
  describe('#page', () => {
    test('tracks a view with the page() parameters', async () => {
      const subscriptions: Subscription[] = [
        {
          partnerAction: 'triggerView',
          name: 'Trigger View',
          enabled: true,
          subscribe: 'type = "page"',
          mapping: {
            viewName: { '@path': '$.name' },
            pageParameters: { '@path': '$.properties' },
            sendNotification: true,
            traits: {
              '@path': '$.traits'
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

      const pageParams = {
        name: 'The Test Suite',
        properties: {
          language: 'ES',
          currency: 'MXN',
          region: {
            country_code: 'MX',
            state: 'Mich'
          }
        }
      }

      const [event] = await adobeTarget({
        ...targetSettings,
        subscriptions
      })

      jest.spyOn(destination, 'initialize')

      destination.actions.triggerView.perform = jest.fn(destination.actions.triggerView.perform)

      await event.load(Context.system(), {} as Analytics)
      expect(destination.initialize).toHaveBeenCalled()

      await event.page?.(
        new Context({
          type: 'page',
          ...pageParams
        })
      )

      expect(destination.actions.triggerView.perform).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          payload: {
            viewName: 'The Test Suite',
            pageParameters: {
              currency: 'MXN',
              language: 'ES',
              region: { country_code: 'MX', state: 'Mich' }
            },
            sendNotification: true
          }
        })
      )

      expect(window.pageParams).toEqual({
        page: {
          language: 'ES',
          currency: 'MXN',
          region: {
            country_code: 'MX',
            state: 'Mich'
          }
        }
      })
    })
  })
})
