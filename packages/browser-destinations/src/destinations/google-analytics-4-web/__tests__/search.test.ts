import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'search',
    name: 'search',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      search_item: {
        '@path': '$.properties.search_item'
      }
    }
  }
]
describe('GoogleAnalytics4Web.search', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.search.perform = jest.fn(destination.actions.search.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'search',
        type: 'track',
        properties: {
          search_item: 'Monopoly: 3rd Edition'
        }
      })
    )
    expect(destination.actions.search.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { search_item: 'Monopoly: 3rd Edition' }
      })
    )
  })
})
