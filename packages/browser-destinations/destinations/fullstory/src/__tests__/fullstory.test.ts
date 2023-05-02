import { Analytics, Context } from '@segment/analytics-next'
import fullstory, { destination } from '..'
import { Subscription } from '@segment/browser-destination-runtime/types'

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
        crossorigin="anonymous"
        src="https://edge.fullstory.com/s/fs.js"
      />,
      <script>
        // the emptiness
      </script>,
    ]
  `)
})

describe('#track', () => {
  it('sends record events to fullstory on "event"', async () => {
    const [event] = await fullstory({
      orgId: 'thefullstory.com',
      subscriptions: example
    })

    await event.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'event')

    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(fs).toHaveBeenCalledWith(
      'hello!',
      {
        banana: '📞'
      },
      'segment-browser-actions'
    )
  })
})

describe('#identify', () => {
  it('should default to anonymousId', async () => {
    const [_, identifyUser] = await fullstory({
      orgId: 'thefullstory.com',
      subscriptions: example
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'setUserVars')
    const fsId = jest.spyOn(window.FS, 'identify')

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
    expect(fs).toHaveBeenCalledWith({ segmentAnonymousId_str: 'anon', testProp: false }, 'segment-browser-actions')
  }),
    it('should send an id', async () => {
      const [_, identifyUser] = await fullstory({
        orgId: 'thefullstory.com',
        subscriptions: example
      })
      await identifyUser.load(Context.system(), {} as Analytics)
      const fsId = jest.spyOn(window.FS, 'identify')

      await identifyUser.identify?.(new Context({ type: 'identify', userId: 'id' }))
      expect(fsId).toHaveBeenCalledWith('id', {}, 'segment-browser-actions')
    }),
    it('should camelCase custom traits', async () => {
      const [_, identifyUser] = await fullstory({
        orgId: 'thefullstory.com',
        subscriptions: example
      })
      await identifyUser.load(Context.system(), {} as Analytics)
      const fsId = jest.spyOn(window.FS, 'identify')

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
      expect(fsId).toHaveBeenCalledWith(
        'id',
        { notCameled: false, firstName: 'John', lastName: 'Doe' },
        'segment-browser-actions'
      )
    })

  it('can set user vars', async () => {
    const [_, identifyUser] = await fullstory({
      orgId: 'thefullstory.com',
      subscriptions: example
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'setUserVars')

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

    expect(fs).toHaveBeenCalledWith(
      {
        displayName: 'Hasbulla',
        email: 'thegoat@world',
        height: '50cm',
        name: 'Hasbulla'
      },
      'segment-browser-actions'
    )
  })
})
