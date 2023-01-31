import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'customEvent',
    name: 'Custom Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.event'
      },
      params: {
        '@path': '$.properties.params'
      }
    }
  }
]

describe('GoogleAnalytics4Web.customEvent', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.customEvent.perform = jest.fn(destination.actions.customEvent.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'Custom Event',
        type: 'track',
        properties: {
          params: [
            {
              paramOne: 'test123',
              paramTwo: 'test123',
              paramThree: 123
            }
          ]
        }
      })
    )
    expect(destination.actions.customEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          name: 'Custom Event',
          params: [{ paramOne: 'test123', paramThree: 123, paramTwo: 'test123' }]
        }
      })
    )
  })
})
