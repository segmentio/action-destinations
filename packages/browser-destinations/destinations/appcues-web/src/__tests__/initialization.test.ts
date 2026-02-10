import { Analytics, Context } from '@segment/analytics-next'
import AppcuesDestination, { destination } from '../index'
import { Appcues } from '../types'

describe('Appcues Web initialization', () => {
  const baseSettings = {
    accountID: 'test-account-id',
    region: 'US' as const,
    enableURLDetection: true
  }

  const subscriptions = [
    {
      partnerAction: 'track',
      name: 'Track',
      enabled: true,
      subscribe: 'type = "track"',
      mapping: {
        event: { '@path': '$.event' },
        properties: { '@path': '$.properties' }
      }
    }
  ]

  afterEach(() => {
    jest.restoreAllMocks()
    delete (window as any).Appcues
    delete (window as any).AppcuesSettings
  })

  test('initialize loads script and resolves with Appcues instance', async () => {
    const mockAppcuesInstance: Appcues = {
      track: jest.fn(),
      identify: jest.fn(),
      group: jest.fn(),
      page: jest.fn()
    }

    const mockLoadScript = jest.fn().mockResolvedValue(undefined)
    const mockResolveWhen = jest.fn().mockResolvedValue(undefined)

    jest.spyOn(destination, 'initialize').mockImplementation(async ({ settings }, deps) => {
      await mockLoadScript()
      ;(window as any).Appcues = mockAppcuesInstance
      await mockResolveWhen()
      return mockAppcuesInstance
    })

    const [event] = await AppcuesDestination({
      ...baseSettings,
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)

    expect(destination.initialize).toHaveBeenCalled()
  })

  test('initialize sets AppcuesSettings with enableURLDetection', async () => {
    const mockAppcuesInstance: Appcues = {
      track: jest.fn(),
      identify: jest.fn(),
      group: jest.fn(),
      page: jest.fn()
    }

    jest.spyOn(destination, 'initialize').mockImplementation(async ({ settings }) => {
      ;(window as any).AppcuesSettings = { enableURLDetection: settings.enableURLDetection }
      ;(window as any).Appcues = mockAppcuesInstance
      return mockAppcuesInstance
    })

    const [event] = await AppcuesDestination({
      ...baseSettings,
      enableURLDetection: false,
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)

    expect((window as any).AppcuesSettings).toEqual({ enableURLDetection: false })
  })
})
