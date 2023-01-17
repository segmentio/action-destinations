import { Analytics, Context } from '@segment/analytics-next'
import segmentUtilitiesDestination, { destination } from '../index'

describe('Segment Utilities Web', () => {
  test('loads the destination', async () => {
    const [throttle] = await segmentUtilitiesDestination({
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
