import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import vwoDestination, { destination } from '../index'
import { initScript } from '../init-script'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      eventName: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('VWO Web (Actions)', () => {
  test('Loads VWO SmartCode with AccountID', async () => {
    const [vwo] = await vwoDestination({
      vwoAccountId: 654331,
      addSmartcode: true,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await vwo.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const vwoObject = window.VWO
    expect(vwoObject).toBeDefined()

    const script = window.document.querySelector(
      'script[src~="https://dev.visualwebsiteoptimizer.com/j.php?a=654331"]'
    ) as HTMLScriptElement
    expect(script).toBeDefined()
  })

  test('Loads VWO Object without initScript', async () => {
    const [vwo] = await vwoDestination({
      vwoAccountId: 654331,
      addSmartcode: false,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await vwo.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const vwoObject = window.VWO
    expect(vwoObject).toBeDefined()
  })
})

describe('VWO SmartCode initScript', () => {
  const THRESHOLD = 1100000

  beforeEach(() => {
    jest.useFakeTimers()
    // ensure script injection and computed values come from initScript invocation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any)._vwo_code
    // v3 smartcode assigns to `code` without declaration; define it for strict-mode Jest runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).code = undefined
    // v3 smartcode directly calls performance.getEntriesByName()
    if (typeof performance.getEntriesByName !== 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(performance as any).getEntriesByName = () => []
    }
    window.document.head.querySelectorAll('script,style').forEach((el) => el.remove())
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).code
    jest.useRealTimers()
  })

  test('uses SmartCode v3.0 when account_id is greater than the threshold', () => {
    const vwoAccountId = THRESHOLD + 1
    initScript({ vwoAccountId })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (window as any)._vwo_code
    expect(code).toBeDefined()
    expect(code.getVersion()).toBe(3.0)

    const injected = window.document.head.querySelector(
      `script[src="https://dev.visualwebsiteoptimizer.com/tag/${vwoAccountId}.js"]`
    )
    expect(injected).not.toBeNull()
  })

  test('uses SmartCode v2.1 when account_id is equal to the threshold', () => {
    const vwoAccountId = THRESHOLD
    initScript({ vwoAccountId })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (window as any)._vwo_code
    expect(code).toBeDefined()
    expect(code.getVersion()).toBe(2.1)
  })

  test('v3.0 sanity: injects the hide style element', () => {
    const vwoAccountId = THRESHOLD + 42
    initScript({ vwoAccountId })

    const style = window.document.head.querySelector('#_vis_opt_path_hides')
    expect(style).not.toBeNull()
    expect(style?.textContent).toContain('opacity:0')
  })
})
