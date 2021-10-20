import * as FullStory from '@fullstory/browser'
import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import fullstory, { destination } from '..'
import { Subscription } from '../../../lib/browser-destinations'

const example: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
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
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      },
      email: {
        '@path': '$.traits.email'
      },
      traits: {
        '@path': '$.traits'
      },
      displayName: {
        '@path': '$.traits.name'
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

  jest.spyOn(destination.actions.trackEvent, 'perform')
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

  expect(destination.actions.trackEvent.perform).toHaveBeenCalled()
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

describe('#track', () => {
  it('sends record events to fullstory on "event"', async () => {
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
})

describe('#identify', () => {
  it('should default to anonymousId', async () => {
    const [_, identifyUser] = await fullstory({
      orgId: 'thefullstory.com',
      subscriptions: example
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(FullStory, 'setUserVars')
    const fsId = jest.spyOn(FullStory, 'identify')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon',
        traits: {
          testProp: false
        }
      })
    )

    expect(fs).toHaveBeenCalled()
    expect(fsId).not.toHaveBeenCalled()
    expect(fs).toHaveBeenCalledWith({ segmentAnonymousId_str: 'anon', testProp: false })
  }),
    it('should send an id', async () => {
      const [_, identifyUser] = await fullstory({
        orgId: 'thefullstory.com',
        subscriptions: example
      })
      await identifyUser.load(Context.system(), {} as Analytics)
      const fsId = jest.spyOn(FullStory, 'identify')

      await identifyUser.identify?.(new Context({ type: 'identify', userId: 'id' }))
      expect(fsId).toHaveBeenCalledWith('id', {})
    }),
    it('should camelCase custom traits', async () => {
      const [_, identifyUser] = await fullstory({
        orgId: 'thefullstory.com',
        subscriptions: example
      })
      await identifyUser.load(Context.system(), {} as Analytics)
      const fsId = jest.spyOn(FullStory, 'identify')

      await identifyUser.identify?.(
        new Context({
          type: 'identify',
          userId: 'id',
          traits: {
            'not-cameled': false,
            'first name': 'John',
            lastName: 'Doe'
          }
        })
      )
      expect(fsId).toHaveBeenCalledWith('id', { notCameled: false, firstName: 'John', lastName: 'Doe' })
    })

  it('can set user vars', async () => {
    const fs = jest.spyOn(FullStory, 'setUserVars')

    const [_, identifyUser] = await fullstory({
      orgId: 'thefullstory.com',
      subscriptions: example
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        traits: {
          name: 'Hasbulla',
          email: 'thegoat@world',
          height: '50cm'
        }
      })
    )

    expect(fs).toHaveBeenCalledWith({
      displayName: 'Hasbulla',
      email: 'thegoat@world',
      height: '50cm',
      name: 'Hasbulla'
    })
  })
})
