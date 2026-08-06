import { Analytics, Context } from '@segment/analytics-next'
import fakeDestination, { destination } from '../index'

describe('Fake Destination (Web)', () => {
  test('has a non-empty authentication scheme', () => {
    expect(destination.settings).toBeDefined()
    expect(Object.keys(destination.settings)).toContain('apiKey')
    expect(destination.settings.apiKey.required).toBe(true)
  })

  test('initializes a client and tracks events', async () => {
    const [event] = await fakeDestination({
      apiKey: 'test-key',
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            event: { '@path': '$.event' },
            properties: { '@path': '$.properties' }
          }
        }
      ]
    })

    const trackSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

    await event.load(Context.system(), {} as Analytics)
    await event.track?.(
      new Context({
        type: 'track',
        event: 'Test Event',
        properties: { foo: 'bar' }
      })
    )

    expect(trackSpy).toHaveBeenCalledWith('[fake-destination-web] track "Test Event"', { foo: 'bar' })
    trackSpy.mockRestore()
  })
})
