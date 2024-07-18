import { Analytics, Context } from '@segment/analytics-next'
import friendbuyDestination, { destination } from '../index'
import nock from 'nock'

const subscriptions = [
  {
    partnerAction: 'trackCustomer',
    name: 'Track Customer',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {}
  }
]

describe('Friendbuy', () => {
  const merchantId = '0ebece2e-b04c-4504-97f2-16cd9f423612'

  test('loading', async () => {
    jest.spyOn(destination, 'initialize')

    nock('https://static.fbot.me').get('/friendbuy.js').reply(200, {})
    nock('https://campaign.fbot.me')
      .get(/^\/[^/]*\/campaigns.js$/)
      .reply(200, {})

    const [event] = await friendbuyDestination({
      merchantId,
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const expectedFriendbuyAPI = [['merchant', merchantId]] as any
    expectedFriendbuyAPI.merchantId = merchantId
    expect(window.friendbuyAPI).toEqual(expectedFriendbuyAPI)
  })
})
