import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleCampaignManager, { destination } from '../index'
import { GTAG } from '../types'

// TODO: Update to reflect code default paths
const subscriptions: Subscription[] = [
  {
    partnerAction: 'counterActivity',
    name: 'Counter Activity',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      activityGroupTagString: {
        '@path': '$.properties.activityGroupTagString'
      },
      activityTagString: {
        '@path': '$.properties.activityTagString'
      },
      countingMethod: {
        '@path': '$.properties.countingMethod'
      },
      enableDynamicTags: {
        '@path': '$.properties.enableDynamicTags'
      }
    }
  }
]

describe('GoogleCampaignManager.counterActivity', () => {
  const settings = {
    advertiserId: 'test123',
    allowAdPersonalizationSignals: false,
    conversionLinker: false
  }

  let mockGTAG: GTAG
  let counterActivityEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleCampaignManager({
      ...settings,
      subscriptions
    })
    counterActivityEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGTAG = {
        gtag: jest.fn()
      }
      return Promise.resolve(mockGTAG.gtag)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('track event', async () => {
    const activityGroupTagString = 'group'
    const activityTagString = 'activity'
    const countingMethod = 'standard'
    const enableDynamicTags = false

    const context = new Context({
      event: 'Counter Activity',
      type: 'track',
      properties: {
        activityGroupTagString,
        activityTagString,
        countingMethod,
        enableDynamicTags
      }
    })
    await counterActivityEvent.track?.(context)

    expect(mockGTAG.gtag).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('conversion'),
      expect.objectContaining({
        allow_custom_scripts: false,
        send_to: `${settings.advertiserId}/${activityGroupTagString}/${activityTagString}+${countingMethod}`
      })
    )
  })
})
