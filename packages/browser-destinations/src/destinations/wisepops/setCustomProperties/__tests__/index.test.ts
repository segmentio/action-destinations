import { Analytics, Context } from '@segment/analytics-next'
import setCustomPropertiesObject from '../index'
import wisepopsDestination from '../../index'
import { Subscription } from '../../../../lib/browser-destinations'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  // Prevent Wisepops SDK from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Wisepops.setCustomProperties', () => {
  const subscriptions: Subscription[] = [
    {
      partnerAction: 'setCustomProperties',
      name: setCustomPropertiesObject.title,
      enabled: true,
      subscribe: setCustomPropertiesObject.defaultSubscription!,
      mapping: {
        traits: {
          '@path': '$.traits'
        },
        userId: {
          '@path': '$.userId'
        },
        temporary: true
      }
    }
  ]

  test('custom properties', async () => {
    const [setCustomProperties] = await wisepopsDestination({
      websiteId: '1234567890',
      subscriptions
    })

    expect(setCustomProperties).toBeDefined()

    await setCustomProperties.load(Context.system(), {} as Analytics)
    jest.spyOn(window.wisepops.q as any, 'push')

    {
      const context = new Context({
        type: 'identify',
        traits: {
          firstName: 'John',
        }
      });

      setCustomProperties.identify?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith(['properties', {
        firstName: 'John',
      }, {
        temporary: true,
      }])
    }

    {
      const context = new Context({
        type: 'identify',
        userId: '42',
        traits: {
          email: 'test@example.com',
          firstName: 'John',
          address: {
            city: 'Paris',
            country: 'France'
          }
        }
      });

      setCustomProperties.identify?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith(['properties', {
        userId: '42',
        email: 'test@example.com',
        firstName: 'John',
        address: {
          city: 'Paris',
          country: 'France'
        }
      }, {
        temporary: true,
      }])
    }

  })
})
