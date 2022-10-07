import { Analytics, Context } from '@segment/analytics-next'
import segmentUtilityDestination, { destination } from '../index'

describe('Segment Utility Web', () => {
  test('loads hubspot analytics with just a HubID', async () => {
    const [throttle] = await segmentUtilityDestination({
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

    jest.spyOn(destination, 'initialize')

    await throttle.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
  })
})
