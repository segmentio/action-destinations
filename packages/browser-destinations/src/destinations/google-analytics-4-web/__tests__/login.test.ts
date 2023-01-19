import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'login',
    name: 'Login',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      method: {
        '@path': '$.properties.method'
      }
    }
  }
]
describe('GoogleAnalytics4Web.login', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.login.perform = jest.fn(destination.actions.login.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'Login',
        type: 'track',
        properties: {
          method: 'Google'
        }
      })
    )
    expect(destination.actions.login.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { method: 'Google' }
      })
    )
  })
})
