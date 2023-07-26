import { Analytics, Context } from '@segment/analytics-next'
import sabil, { destination } from '../index'
import { subscriptions, TEST_CLIENT_ID } from '../test-utils'

test.skip('load Sabil', async () => {
  const [event] = await sabil({
    client_id: TEST_CLIENT_ID,
    subscriptions
  })

  jest.spyOn(destination, 'initialize')

  await event.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()
  expect(window.Sabil).toHaveProperty('attach')
})
