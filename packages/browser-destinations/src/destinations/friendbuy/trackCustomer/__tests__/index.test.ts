import { Analytics, Context } from '@segment/analytics-next'
import friendbuyDestination from '../../index'
import trackCustomerObject, { trackCustomerDefaultSubscription, trackCustomerFields } from '../index'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  // Prevent friendbuy.js and campaigns.js from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Friendbuy.trackCustomer', () => {
  // console.log('trackCustomer', JSON.stringify(trackCustomer, null, 2))

  const subscriptions = [
    {
      partnerAction: 'trackCustomer',
      name: trackCustomerObject.title,
      enabled: true,
      subscribe: trackCustomerDefaultSubscription,
      mapping: Object.fromEntries(
        Object.entries(trackCustomerFields)
          .map(([name, value]) => [name, value.default])
          .concat(
            ['customerSince', 'loyaltyStatus', 'isNewCustomer'].map((name) => [name, { '@path': `$.traits.${name}` }])
          )
      )
    }
  ]

  // console.log('subscriptions', JSON.stringify(subscriptions, null, 2))

  test('all fields', async () => {
    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const firstName = 'John'
    const lastName = 'Doe'
    const name = `${firstName} ${lastName}`
    const email = 'john.doe@example.com'
    const age = 55
    const customerSince = '2021-10-20T14:20:15Z'
    const loyaltyStatus = 'in'
    const isNewCustomer = false

    const [trackCustomer] = await friendbuyDestination({
      merchantId,
      subscriptions
    })
    // console.log('trackCustomer', JSON.stringify(trackCustomer, null, 2), trackCustomer)
    expect(trackCustomer).toBeDefined()

    await trackCustomer.load(Context.system(), {} as Analytics)

    // console.log(window.friendbuyAPI)
    jest.spyOn(window.friendbuyAPI as any, 'push')

    {
      // all fields
      const context1 = new Context({
        type: 'identify',
        userId,
        traits: {
          email,
          firstName,
          lastName,
          name,
          age,
          customerSince,
          loyaltyStatus,
          isNewCustomer
        }
      })
      // console.log('context1', JSON.stringify(context1, null, 2))

      trackCustomer.identify?.(context1)

      // console.log('trackCustomer request', JSON.stringify(window.friendbuyAPI.push.mock.calls[0], null, 2))
      expect(window.friendbuyAPI?.push).toHaveBeenNthCalledWith(1, [
        'track',
        'customer',
        {
          id: userId,
          email,
          firstName,
          lastName,
          name,
          age,
          customerSince,
          loyaltyStatus,
          isNewCustomer
        }
      ])
    }

    {
      // name derived from firstName and lastName
      const context2 = new Context({
        type: 'identify',
        userId,
        traits: {
          firstName,
          lastName
        }
      })

      trackCustomer.identify?.(context2)

      expect(window.friendbuyAPI?.push).toHaveBeenNthCalledWith(2, [
        'track',
        'customer',
        {
          id: userId,
          firstName,
          lastName,
          name
        }
      ])
    }

    {
      // name without firstName and lastName
      const context3 = new Context({
        type: 'identify',
        userId,
        traits: {
          email,
          name
        }
      })

      trackCustomer.identify?.(context3)

      expect(window.friendbuyAPI?.push).toHaveBeenNthCalledWith(3, [
        'track',
        'customer',
        {
          id: userId,
          email,
          name
        }
      ])
    }
  })
})
