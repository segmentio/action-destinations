import { Analytics, Context } from '@segment/analytics-next'
import friendbuyDestination from '../../index'
import trackSignUpObject, { trackSignUpDefaultSubscription, trackSignUpFields } from '../index'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  // Prevent friendbuy.js and campaigns.js from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Friendbuy.trackSignUp', () => {
  const subscriptions = [
    {
      partnerAction: 'trackSignUp',
      name: trackSignUpObject.title,
      enabled: true,
      subscribe: trackSignUpDefaultSubscription,
      mapping: Object.fromEntries(Object.entries(trackSignUpFields).map(([name, value]) => [name, value.default]))
    }
  ]

  test('all fields', async () => {
    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const firstName = 'John'
    const lastName = 'Doe'
    const name = `${firstName} ${lastName}`
    const email = 'john.doe@example.com'
    const loyaltyStatus = 'in'

    const [trackSignUp] = await friendbuyDestination({
      merchantId,
      subscriptions
    })
    // console.log('trackSignUp', JSON.stringify(trackSignUp, null, 2), trackSignUp)
    expect(trackSignUp).toBeDefined()

    await trackSignUp.load(Context.system(), {} as Analytics)

    // console.log(window.friendbuyAPI)
    jest.spyOn(window.friendbuyAPI as any, 'push')

    const context = new Context({
      type: 'track',
      event: 'Signed Up',
      userId,
      properties: {
        first_name: firstName,
        last_name: lastName,
        name,
        email,
        loyaltyStatus
      }
    })
    // console.log('context', JSON.stringify(context, null, 2))

    trackSignUp.track?.(context)

    // console.log('trackSignUp request', JSON.stringify(window.friendbuyAPI.push.mock.calls[0], null, 2))
    expect(window.friendbuyAPI?.push).toHaveBeenCalledWith([
      'track',
      'sign_up',
      {
        id: userId,
        email,
        firstName,
        lastName,
        name,
        loyaltyStatus
      }
    ])
  })
})
