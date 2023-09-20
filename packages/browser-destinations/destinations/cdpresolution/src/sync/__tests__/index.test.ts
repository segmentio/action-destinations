import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import cdpResolutionDestination, { destination } from '../../index'
import { CDPResolution } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'sync',
    name: 'Sync User ID to CDP Resolution',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
      }
    }
  }
]

describe('CDPResolution.sync', () => {
  const settings = {
    endpoint: 'https://a.usbrowserspeed.com/cs',
    ClientIdentifier: 'clientid1'
  }

  let mockCDPResolution: CDPResolution
  let syncAction: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [syncEvent] = await cdpResolutionDestination({
      ...settings,
      subscriptions
    })
    syncAction = syncEvent

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockCDPResolution = {
        sync: jest.fn()
      }
      return Promise.resolve(mockCDPResolution)
    })
    await syncAction.load(Context.system(), {} as Analytics)
  })

  test('calls the cdpResolution Client sync() function', async () => {
    const context = new Context({
      type: 'identify',
      anonymousId: 'aid1'
    })
    await syncAction.sync?.(context)

    expect(mockCDPResolution.sync).toHaveBeenCalledWith('https://a.usbrowserspeed.com/cs', 'clientid1', 'aid1')
  })
})
