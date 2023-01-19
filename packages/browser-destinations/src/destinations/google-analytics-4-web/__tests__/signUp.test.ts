import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'signUp',
    name: 'signUp',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      method: {
        '@path': '$.properties.method'
      }
    }
  }
]
describe('GoogleAnalytics4Web.signUp', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.signUp.perform = jest.fn(destination.actions.signUp.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'signUp',
        type: 'track',
        properties: {
          method: 'Google'
        }
      })
    )
    expect(destination.actions.signUp.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { method: 'Google' }
      })
    )
  })
})
