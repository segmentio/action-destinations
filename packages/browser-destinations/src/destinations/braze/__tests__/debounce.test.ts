import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import brazeDestination from '../index'

let ajs: Analytics

describe('debounce', () => {
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
  <!DOCTYPE html>
    <head>
      <script>'hi'</script>
    </head>
    <body>
    </body>
  </html>
  `.trim()

    const jsd = new jsdom.JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://segment.com'
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    const documentSpy = jest.spyOn(global, 'document', 'get')

    windowSpy.mockImplementation(() => {
      return jsd.window as unknown as Window & typeof globalThis
    })

    documentSpy.mockImplementation(() => jsd.window.document as unknown as Document)
    global.document.domain = 'segment.com'

    jest.spyOn(console, 'error').mockImplementation(() => {})

    ajs = new Analytics({
      writeKey: 'w_123'
    })
  })

  test('changes the integration object', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await debounce.load(Context.system(), ajs)
    const ctx = await debounce.identify?.(
      new Context({
        type: 'identify',
        userId: 'hasbulla',
        anonymousId: 'the goat',
        traits: {}
      })
    )

    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)
  })

  test('does not send the event to braze if IDs are the same', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    const ctx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)

    const secondCtx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(secondCtx.event.integrations['Braze Web Mode (Actions)']).toBe(false)
  })

  test('ignores blank anonymous ids', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    const ctx = await ajs.identify()
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)

    const secondCtx = await ajs.identify()
    expect(secondCtx.event.integrations['Braze Web Mode (Actions)']).toBe(false)
  })

  test('send events on trait changes', async () => {
    const [debounce] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      subscriptions: [
        {
          partnerAction: 'debounce',
          name: 'Debounce',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {}
        }
      ]
    })

    await ajs.register(debounce)

    const ctx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(ctx.event.integrations['Braze Web Mode (Actions)']).toBe(true)

    const sameCtx = await ajs.identify('hasbulla', {
      goat: true
    })
    expect(sameCtx.event.integrations['Braze Web Mode (Actions)']).toBe(false)

    const changedTraits = await ajs.identify('hasbulla', {
      weight: 'feather'
    })
    expect(changedTraits.event.integrations['Braze Web Mode (Actions)']).toBe(true)
  })
})
