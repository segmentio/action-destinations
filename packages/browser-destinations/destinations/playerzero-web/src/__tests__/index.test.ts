import { Analytics, Context } from '@segment/analytics-next'
import playerzero, { destination } from '../index'
import { subscriptions, TEST_PROJECT_ID } from '../test-utils'

test.skip('load PlayerZero', async () => {
  const [event] = await playerzero({
    projectId: TEST_PROJECT_ID,
    subscriptions
  })

  jest.spyOn(destination, 'initialize')

  await event.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()
  expect(window.playerzero).toHaveProperty('track')
  expect(window.playerzero).toHaveProperty('identify')
  expect(window.playerzero).toHaveProperty('setUserVars')
})
