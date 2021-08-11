import * as FullStory from '@fullstory/browser'
import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import fullstory, { destination } from '..'
import { Subscription } from '../../../lib/browser-destinations'

const example: Subscription[] = [
  {
    partnerAction: 'event',
    name: 'Event',
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
  },
  {
    partnerAction: 'setUserVars',
    name: 'SetUserVars',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      displayName: {
        '@path': '$.traits.name'
      },
      email: {
        '@path': '$.traits.email'
      },
      traits: {
        '@path': '$.traits'
      }
    }
  }
]

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
    url: 'https://fullstory.com'
  })

  const windowSpy = jest.spyOn(window, 'window', 'get')
  windowSpy.mockImplementation(() => jsd.window as unknown as Window & typeof globalThis)
})

test('can load fullstory', async () => {
  const [event] = await fullstory({
    orgId: 'thefullstory.com',
    subscriptions: example
  })

  jest.spyOn(destination.actions.event, 'perform')
  jest.spyOn(destination, 'initialize')

  await event.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()

  const ctx = await event.track?.(
    new Context({
      type: 'track',
      properties: {
        banana: '📞'
      }
    })
  )

  expect(destination.actions.event.perform).toHaveBeenCalled()
  expect(ctx).not.toBeUndefined()

  const scripts = window.document.querySelectorAll('script')
  expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script
        src="https://edge.fullstory.com/s/fs.js"
        status="loaded"
        type="text/javascript"
      />,
      <script>
        'hi'
      </script>,
    ]
  `)
})

test('send record events to fullstory on "event"', async () => {
  const fs = jest.spyOn(FullStory, 'event')

  const [event] = await fullstory({
    orgId: 'thefullstory.com',
    subscriptions: example
  })

  await event.load(Context.system(), {} as Analytics)
  await event.track?.(
    new Context({
      type: 'track',
      name: 'hello!',
      properties: {
        banana: '📞'
      }
    })
  )

  expect(fs).toHaveBeenCalledWith('hello!', {
    banana: '📞'
  })
})

test('can set user vars', async () => {
  const fs = jest.spyOn(FullStory, 'setUserVars')

  const [_, setUserVars] = await fullstory({
    orgId: 'thefullstory.com',
    subscriptions: example
  })

  await setUserVars.load(Context.system(), {} as Analytics)
  await setUserVars.identify?.(
    new Context({
      type: 'identify',
      traits: {
        name: 'Hasbulla',
        email: 'thegoat@world',
        height: '50cm'
      }
    })
  )

  expect(fs).toHaveBeenCalledWith({ displayName: 'Hasbulla', email: 'thegoat@world', height: '50cm', name: 'Hasbulla' })
})
