import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleCampaignManager, { destination } from '../index'
import { GTAG } from '../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'salesActivity',
    name: 'Sales Activity',
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
      value: {
        '@path': '$.properties.value'
      },
      transactionId: {
        '@path': '$.properties.transactionId'
      },
      quantity: 1,
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

describe('GoogleCampaignManager.salesActivity', () => {
  const settings = {
    advertiserId: 'test123',
    allowAdPersonalizationSignals: false,
    conversionLinker: false
  }

  let mockGTAG: GTAG
  let salesActivityEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleCampaignManager({
      ...settings,
      subscriptions
    })
    salesActivityEvent = trackEventPlugin

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
    const countingMethod = 'transactions'
    const enableDynamicTags = false
    const transactionId = 'my-transaction'

    const context = new Context({
      event: 'Sales Activity',
      type: 'track',
      properties: {
        activityGroupTagString,
        activityTagString,
        countingMethod,
        enableDynamicTags,
        value: 10,
        transactionId
      }
    })
    await salesActivityEvent.track?.(context)

    expect(mockGTAG.gtag).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('purchase'),
      expect.objectContaining({
        allow_custom_scripts: enableDynamicTags,
        send_to: `${settings.advertiserId}/${activityGroupTagString}/${activityTagString}+${countingMethod}`,
        quantity: 1,
        value: 10,
        transaction_id: transactionId,
        u1: 'custom variable 1',
        u2: 'custom variable 2',
        dc_custom_params: { dc_lat: 0, tag_for_child_directed_treatment: 1 }
      })
    )
  })
})
