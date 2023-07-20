import { Analytics, Context } from '@segment/analytics-next'
import setCustomPropertiesObject from '../index'
import wisepopsDestination from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

import { loadScript } from '@segment/browser-destination-runtime/load-script'
jest.mock('@segment/browser-destination-runtime/load-script')
beforeEach(async () => {
  // Prevent Wisepops SDK from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Wisepops.setCustomProperties', () => {
  test('custom properties', async () => {
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
          id: {
            '@path': '$.userId'
          },
          idProperty: 'userId'
        }
      }
    ]

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
          firstName: 'John'
        }
      })

      setCustomProperties.identify?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith([
        'properties',
        {
          firstName: 'John'
        }
      ])
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
      })

      setCustomProperties.identify?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith([
        'properties',
        {
          userId: '42',
          email: 'test@example.com',
          firstName: 'John',
          address: {
            city: 'Paris',
            country: 'France'
          }
        }
      ])
    }
  })

  test('nested custom properties', async () => {
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
          prefix: 'user',
          id: {
            '@path': '$.userId'
          },
          idProperty: 'userId'
        }
      }
    ]

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
          firstName: 'John'
        }
      })

      setCustomProperties.identify?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith([
        'properties',
        {
          user: {
            firstName: 'John'
          }
        }
      ])
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
      })

      setCustomProperties.identify?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith([
        'properties',
        {
          user: {
            userId: '42',
            email: 'test@example.com',
            firstName: 'John',
            address: {
              city: 'Paris',
              country: 'France'
            }
          }
        }
      ])
    }
  })
})
