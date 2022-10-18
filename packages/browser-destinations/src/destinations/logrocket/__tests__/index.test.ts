import { Analytics, Context } from '@segment/analytics-next'
import plugins, { destination } from '../index'
import { subscriptions } from './subscriptions'
import { mockWorkerAndXMLHttpRequest } from './utilities'

describe('Logrocket', () => {
  beforeAll(mockWorkerAndXMLHttpRequest)
  afterAll(jest.restoreAllMocks)

  test('can load', async () => {
    const [event] = await plugins({ appID: 'log/rocket', subscriptions })

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
