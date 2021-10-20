import appboy from '@braze/web-sdk'
import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination from '../index'

describe('trackEvent', () => {
  beforeEach(async () => {
    // we're not really testing that appboy loads here, so we'll just mock it out
    jest.spyOn(appboy, 'initialize').mockImplementation(() => true)
    jest.spyOn(appboy, 'openSession').mockImplementation(() => true)
  })

  test('changes the external_id when present', async () => {
    const customEvent = jest.spyOn(appboy, 'logCustomEvent').mockReturnValue(true)

    const [trackEvent] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '3.3',
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Log Custom Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            eventName: {
              '@path': '$.event'
            },
            eventProperties: {
              '@path': '$.properties'
            }
          }
        }
      ]
    })

    await trackEvent.load(Context.system(), {} as Analytics)
    await trackEvent.track?.(
      new Context({
        type: 'track',
        event: 'UFC',
        properties: {
          goat: 'hasbulla'
        }
      })
    )

    expect(customEvent).toHaveBeenCalledWith('UFC', { goat: 'hasbulla' })
  })
})
