import { Analytics, Context } from '@segment/analytics-next'
import segmentUtilitiesDestination from '../destinations/segment-utilities-web/src/index'

it('window object shouldnt be changed by actions core', async () => {
  const windowBefore = Object.keys(window)

  // load a plugin that doesn't alter window object
  const [plugin] = await segmentUtilitiesDestination({
    throttleWindow: 3000,
    passThroughCount: 1,
    subscriptions: [
      {
        partnerAction: 'throttle',
        name: 'Throttle',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {}
      }
    ]
  })

  await plugin.load(Context.system(), {} as Analytics)

  const windowAfter = Object.keys(window)

  // window object shouldn't change as long as actions-core isn't changing it
  expect(windowBefore.sort()).toEqual(windowAfter.sort())
})
