import { Analytics, Context } from '@segment/analytics-next'
import plugins, { destination } from '../index'
import { mockWorkerAndXMLHttpRequest, subscriptions } from '../test_utilities'
import Logrocket from 'logrocket'

jest.mock('logrocket')

const appID = 'log/rocket'

describe('Logrocket', () => {
  beforeAll(mockWorkerAndXMLHttpRequest)
  afterAll(jest.restoreAllMocks)

  test('can load', async () => {
    const [event] = await plugins({
      appID,
      networkSanitization: false,
      inputSanitization: false,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')
    jest.spyOn(Logrocket, 'init')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(Logrocket.init).toHaveBeenCalled()

    expect(window._LRLogger).toBeDefined()
  })

  test('supplies the input sanitization parameter', async () => {
    const [event] = await plugins({
      appID,
      networkSanitization: false,
      inputSanitization: true,
      subscriptions
    })

    jest.spyOn(Logrocket, 'init')

    await event.load(Context.system(), {} as Analytics)
    expect(Logrocket.init).toHaveBeenCalledWith(appID, expect.objectContaining({ dom: { inputSanitizer: true } }))
  })

  describe('network sanitizer', () => {
    test('redacts requests when configured', async () => {
      const [event] = await plugins({
        appID,
        networkSanitization: true,
        inputSanitization: false,
        subscriptions
      })

      const spy = jest.spyOn(Logrocket, 'init')

      await event.load(Context.system(), {} as Analytics)
      expect(Logrocket.init).toHaveBeenCalledWith(appID, expect.objectContaining({ dom: { inputSanitizer: false } }))
      const requestSanitizer: RequestSanitizer = spy.mock.calls[0][1]?.network?.requestSanitizer

      if (!requestSanitizer) fail('request sanitizer null')

      const mockRequest = {
        body: 'hello',
        headers: { goodbye: 'moon' },
        reqId: 'something',
        url: 'neat',
        method: 'get'
      }

      const sanitizedResult = requestSanitizer(mockRequest)

      expect(sanitizedResult).toEqual(expect.objectContaining({ body: undefined, headers: {} }))
    })

    test('does not modify requests if disabled', async () => {
      const [event] = await plugins({
        appID,
        networkSanitization: false,
        inputSanitization: false,
        subscriptions
      })

      const spy = jest.spyOn(Logrocket, 'init')

      await event.load(Context.system(), {} as Analytics)
      expect(Logrocket.init).toHaveBeenCalledWith(appID, expect.objectContaining({ dom: { inputSanitizer: false } }))
      const requestSanitizer: RequestSanitizer = spy.mock.calls[0][1]?.network?.requestSanitizer

      if (!requestSanitizer) fail('request sanitizer null')

      const mockRequest = {
        body: 'hello',
        headers: { goodbye: 'moon' },
        reqId: 'something',
        url: 'neat',
        method: 'get'
      }

      const sanitizedResult = requestSanitizer(mockRequest)

      expect(sanitizedResult).toEqual(mockRequest)
    })
  })
})
