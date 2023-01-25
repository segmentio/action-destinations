import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'generateLead',
    name: 'Generate Leaad',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      currency: {
        '@path': '$.properties.currency'
      },
      value: {
        '@path': '$.properties.value'
      }
    }
  }
]

describe('GoogleAnalytics4Web.generateLead', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.generateLead.perform = jest.fn(destination.actions.generateLead.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'Generate Lead',
        type: 'track',
        properties: {
          currency: 'USD',
          value: 10
        }
      })
    )
    expect(destination.actions.generateLead.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { currency: 'USD', value: 10 }
      })
    )
  })
})