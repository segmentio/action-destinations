import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import commandBarDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event_name: {
        '@path': '$.event'
      },
      event_metadata: {
        '@path': '$.properties'
      }
    }
  }
]

describe('CommandBar.trackEvent', () => {
  const settings = {
    orgId: 'xxxxxxxx'
  }
  let mockCommandBarTrackEvent: jest.Mock<any, any>

  let plugin: any

  beforeEach(async () => {
    const [commandBarPlugin] = await commandBarDestination({
      ...settings,
      subscriptions
    })

    plugin = commandBarPlugin

    mockCommandBarTrackEvent = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithTrack = {
        boot: jest.fn(),
        addMetadataBatch: jest.fn(),
        trackEvent: mockCommandBarTrackEvent
      }
      return Promise.resolve(mockedWithTrack)
    })
    await plugin.load(Context.system(), {} as Analytics)
  })

  it('Sends events to CommandBar', async () => {
    await plugin.track?.(
      new Context({
        type: 'track',
        event: 'example-event',
        properties: {
          foo: 'bar'
        }
      })
    )

    expect(mockCommandBarTrackEvent).toHaveBeenCalledWith('example-event', { foo: 'bar' })
  })
})
