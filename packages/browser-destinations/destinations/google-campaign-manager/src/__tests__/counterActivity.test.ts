import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleCampaignManager, { destination } from '../index'

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
      },
      sessionId: {
        '@path': '$.properties.sessionId'
      },
      uVariables: {
        u1: 'custom variable 1',
        u2: 'custom variable 2'
      },
      dcCustomParams: {
        dc_lat: 0,
        tag_for_child_directed_treatment: 1
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

  let mockGTAG: typeof gtag
  let counterActivityEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleCampaignManager({
      ...settings,
      subscriptions
    })
    counterActivityEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGTAG = jest.fn()

      return Promise.resolve(mockGTAG)
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

    expect(mockGTAG).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('conversion'),
      expect.objectContaining({
        allow_custom_scripts: enableDynamicTags,
        send_to: `${settings.advertiserId}/${activityGroupTagString}/${activityTagString}+${countingMethod}`,
        u1: 'custom variable 1',
        u2: 'custom variable 2',
        dc_custom_params: { dc_lat: 0, tag_for_child_directed_treatment: 1 }
      })
    )
  })

  test('track event (per session)', async () => {
    const activityGroupTagString = 'group'
    const activityTagString = 'activity'
    const countingMethod = 'per_session'
    const enableDynamicTags = false
    const sessionId = 'my_session'

    const context = new Context({
      event: 'Counter Activity',
      type: 'track',
      properties: {
        activityGroupTagString,
        activityTagString,
        countingMethod,
        enableDynamicTags,
        sessionId
      }
    })
    await counterActivityEvent.track?.(context)

    expect(mockGTAG).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('conversion'),
      expect.objectContaining({
        allow_custom_scripts: enableDynamicTags,
        send_to: `${settings.advertiserId}/${activityGroupTagString}/${activityTagString}+${countingMethod}`,
        session_id: sessionId,
        u1: 'custom variable 1',
        u2: 'custom variable 2',
        dc_custom_params: { dc_lat: 0, tag_for_child_directed_treatment: 1 }
      })
    )
  })
})
