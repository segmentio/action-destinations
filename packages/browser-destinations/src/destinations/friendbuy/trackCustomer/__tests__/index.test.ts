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
      mapping: Object.fromEntries(Object.entries(trackCustomerFields).map(([name, value]) => [name, value.default]))
    }
  ]

  // console.log('subscriptions', JSON.stringify(subscriptions, null, 2))

  test('all fields', async () => {
    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const firstName = 'John'
    const lastName = 'Doe'
    const email = 'john.doe@example.com'

    const [trackCustomer] = await friendbuyDestination({
      merchantId,
      subscriptions
    })
    // console.log('trackCustomer', JSON.stringify(trackCustomer, null, 2), trackCustomer)
    expect(trackCustomer).toBeDefined()

    await trackCustomer.load(Context.system(), {} as Analytics)

    // console.log(window.friendbuyAPI)
    jest.spyOn(window.friendbuyAPI as any, 'push')

    const context = new Context({
      type: 'identify',
      userId,
      traits: {
        firstName,
        lastName,
        email
      }
    })
    // console.log('context', JSON.stringify(context, null, 2))

    trackCustomer.identify?.(context)

    // console.log('trackCustomer request', JSON.stringify(window.friendbuyAPI.push.mock.calls[0], null, 2))
    expect(window.friendbuyAPI?.push).toHaveBeenCalledWith([
      'track',
      'customer',
      {
        id: userId,
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`
      }
    ])
  })
})
