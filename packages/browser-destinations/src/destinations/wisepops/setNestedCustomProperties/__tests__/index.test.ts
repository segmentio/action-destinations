import { Analytics, Context } from '@segment/analytics-next'
import setNestedCustomPropertiesObject from '../index'
import wisepopsDestination from '../../index'
import { Subscription } from '../../../../lib/browser-destinations'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  // Prevent Wisepops SDK from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Wisepops.setNestedCustomProperties', () => {
  const subscriptions: Subscription[] = [
    {
      partnerAction: 'setNestedCustomProperties',
      name: setNestedCustomPropertiesObject.title,
      enabled: true,
      subscribe: setNestedCustomPropertiesObject.defaultSubscription!,
      mapping: {
        traits: {
          '@path': '$.traits'
        },
        nestedProperty: 'group',
        groupId: {
          '@path': '$.groupId'
        },
        temporary: true
      }
    }
  ]

  test('nested custom properties', async () => {
    const [setNestedCustomProperties] = await wisepopsDestination({
      websiteHash: '1234567890',
      subscriptions
    })

    expect(setNestedCustomProperties).toBeDefined()

    await setNestedCustomProperties.load(Context.system(), {} as Analytics)
    jest.spyOn(window.wisepops.q as any, 'push')

    {
      const context = new Context({
        type: 'group',
        traits: {
          name: 'Group name',
        }
      });

      setNestedCustomProperties.group?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith(['properties', {
        group: {
          name: 'Group name',
        },
      }, {
        temporary: true,
      }])
    }

    {
      const context = new Context({
        type: 'group',
        groupId: '42',
        traits: {
          name: 'Group name',
          address: {
            city: 'Paris',
            country: 'France'
          }
        }
      });

      setNestedCustomProperties.track?.(context)

      expect(window.wisepops.q.push).toHaveBeenCalledWith(['properties', {
        group: {
          groupId: '42',
          name: 'Group name',
          address: {
            city: 'Paris',
            country: 'France'
          }
        }
      }, {
        temporary: true,
      }])
    }

  })
})
