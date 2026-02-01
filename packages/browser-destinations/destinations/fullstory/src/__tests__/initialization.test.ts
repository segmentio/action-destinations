import { Analytics, Context } from '@segment/analytics-next'
import fullstory, { destination } from '..'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { JSONArray } from '@segment/actions-core'
import * as FullStoryTypes from '../types'

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

beforeEach(() => {
  jest.restoreAllMocks()
  // Reset FullStory initialization state
  delete window._fs_initialized
  delete window._fs_script
  delete window._fs_org
  delete window._fs_namespace
  if (typeof window._fs_namespace === 'number') {
    delete window[window._fs_namespace]
  }
  // @ts-ignore
  delete window.FS
})

test('can load fullstory', async () => {
  const [event] = await fullstory({
    orgId: 'thefullstory.com',
    host: 'customdomain.com',
    subscriptions: example as unknown as JSONArray
  })

  jest.spyOn(destination.actions.trackEvent, 'perform')
  jest.spyOn(destination, 'initialize')

  await event.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()

  const ctx = await event.track?.(
    new Context({
      type: 'track',
      properties: {
        banana: 'banana'
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

describe('custom domain settings', () => {
  let initFullStorySpy: jest.SpyInstance

  beforeEach(() => {
    initFullStorySpy = jest.spyOn(FullStoryTypes, 'initFullStory')
  })

  test('initializes with custom host setting', async () => {
    const [event] = await fullstory({
      orgId: 'test-org-id',
      subscriptions: example as unknown as JSONArray,
      host: 'custom-recording.example.com'
    })

    await event.load(Context.system(), {} as Analytics)

    expect(initFullStorySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'test-org-id',
        host: 'custom-recording.example.com'
      })
    )
  })

  test('initializes with custom appHost setting', async () => {
    const [event] = await fullstory({
      orgId: 'test-org-id',
      subscriptions: example as unknown as JSONArray,
      appHost: 'app.example.com'
    })

    await event.load(Context.system(), {} as Analytics)

    expect(initFullStorySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'test-org-id',
        appHost: 'app.example.com'
      })
    )
  })

  test('initializes with custom script URL setting', async () => {
    const [event] = await fullstory({
      orgId: 'test-org-id',
      subscriptions: example as unknown as JSONArray,
      script: 'custom-cdn.example.com/fs.js'
    })

    await event.load(Context.system(), {} as Analytics)

    expect(initFullStorySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'test-org-id',
        script: 'custom-cdn.example.com/fs.js'
      })
    )

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          crossorigin="anonymous"
          src="https://custom-cdn.example.com/fs.js"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })

  test('initializes with all custom settings together', async () => {
    const [event] = await fullstory({
      orgId: 'test-org-id',
      subscriptions: example as unknown as JSONArray,
      host: 'custom-recording.example.com',
      appHost: 'app.example.com',
      script: 'custom-cdn.example.com/fs.js'
    })

    await event.load(Context.system(), {} as Analytics)

    expect(initFullStorySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'test-org-id',
        host: 'custom-recording.example.com',
        appHost: 'app.example.com',
        script: 'custom-cdn.example.com/fs.js'
      })
    )

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          crossorigin="anonymous"
          src="https://custom-cdn.example.com/fs.js"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })

  test('initializes without custom settings when not provided', async () => {
    const [event] = await fullstory({
      orgId: 'test-org-id',
      subscriptions: example as unknown as JSONArray
    })

    await event.load(Context.system(), {} as Analytics)

    const callArgs = initFullStorySpy.mock.calls[0][0]
    expect(callArgs).toEqual(
      expect.objectContaining({
        orgId: 'test-org-id'
      })
    )
    expect(callArgs).not.toHaveProperty('host')
    expect(callArgs).not.toHaveProperty('appHost')
    expect(callArgs).not.toHaveProperty('script')

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

  test('initializes with debug and recordOnlyThisIFrame along with custom settings', async () => {
    const [event] = await fullstory({
      orgId: 'test-org-id',
      subscriptions: example as unknown as JSONArray,
      debug: true,
      recordOnlyThisIFrame: true,
      host: 'custom-recording.example.com',
      appHost: 'app.example.com'
    })

    await event.load(Context.system(), {} as Analytics)

    expect(initFullStorySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'test-org-id',
        debug: true,
        recordOnlyThisIFrame: true,
        host: 'custom-recording.example.com',
        appHost: 'app.example.com'
      })
    )
  })
})
