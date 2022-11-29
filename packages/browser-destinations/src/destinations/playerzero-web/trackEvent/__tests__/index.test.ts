import { Analytics, Context } from '@segment/analytics-next'
import playerzero, { destination } from '../../index'
import { subscriptions, TEST_PROJECT_ID } from '../../test-utils'

describe('PlayerzeroWeb.trackEvent', () => {
  it.skip('emits a PlayerZero track event', async () => {
    const [event] = await playerzero({
      projectId: TEST_PROJECT_ID,
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)
    jest.spyOn(destination.actions.trackEvent, 'perform')
    const pz = jest.spyOn(window.playerzero, 'track')

    const ctx = await event.track?.(
      new Context({
        type: 'track',
        name: 'test event',
        properties: {
          hello: 'world'
        }
      })
    )

    expect(ctx).not.toBeUndefined()
    expect(pz).toHaveBeenCalledWith('test event', {
      hello: 'world'
    })

    expect(destination.actions.trackEvent.perform).toHaveBeenCalled()
  })
})
