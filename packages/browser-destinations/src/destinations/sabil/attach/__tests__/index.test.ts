import { Analytics, Context } from '@segment/analytics-next'
import sabil from '../../index'
import { subscriptions, TEST_CLIENT_ID, TEST_USER_ID } from '../../test-utils'

describe('Sabil.attach', () => {
  it('should call attach on identify event', async () => {
    const [plugin] = await sabil({
      client_id: TEST_CLIENT_ID,
      subscriptions
    })
    window.Sabil = {
      attach: jest.fn()
    }
    await plugin.load(Context.system(), {} as Analytics)
    const spy = jest.spyOn(window.Sabil, 'attach')

    await plugin.identify?.(
      new Context({
        type: 'identify',
        userId: TEST_USER_ID
      })
    )
    expect(spy).toHaveBeenCalled()
  })
})
