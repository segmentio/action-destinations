import { Analytics, Context } from '@segment/analytics-next'
import plugins, { destination } from '../index'
import { Subscription } from '../../../lib/browser-destinations'
// import WorkerStub from 'test/worker-stub'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'track',
    name: 'Track',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

class WorkerStub {
  url: string
  onmessage: (_arg: string) => void
  constructor(stringUrl: string) {
    this.url = stringUrl
    this.onmessage = (_arg: string) => {}
  }

  postMessage(msg: string) {
    this.onmessage(msg)
  }

  addEventListener() {}
}

describe('Logrocket', () => {
  test('can load', async () => {
    const [event] = await plugins({ appID: 'log/rocket', subscriptions })

    window.XMLHttpRequest = jest.fn()
    window.Worker = WorkerStub
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    // const script = document.getElementsByTagName('script')[1];
    // console.log(script.innerHTML)

    const headElements = window.document.head.children

    const scriptCandidate = headElements[0]
    console.log('data form test', headElements.length)
    console.log(headElements[0].innerHTML)

    expect(headElements.length).toBe(2)

    const source = scriptCandidate.getAttribute('src')
    expect(source).toEqual('https://cdn.lr-in-prod.com/logger-1.min.js')
    // expect(window.__SDKCONFIG__).toBeDefined()
  })
})
