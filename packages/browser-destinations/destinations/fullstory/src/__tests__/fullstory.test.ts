import { Analytics, Context } from '@segment/analytics-next'
import fullstory from '..'
import trackEvent from '../trackEvent'
import identifyUser from '../identifyUser'
import viewedPage from '../viewedPage'
import { defaultValues, JSONArray } from '@segment/actions-core'

const FakeOrgId = 'asdf-qwer'

const example: JSONArray = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields)
  },
  {
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: defaultValues(identifyUser.fields)
  },
  {
    partnerAction: 'viewedPage',
    name: 'Viewed Page',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: defaultValues(viewedPage.fields)
  }
]

beforeEach(() => {
  jest.restoreAllMocks()
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

describe('#track', () => {
  it('sends record events to fullstory on "event"', async () => {
    const [event] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example 
    })

    await event.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'event')

    await event.track?.(
      new Context({
        type: 'track',
        event: 'hello!',
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
    const [_, identify] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await identify.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'setUserVars')
    const fsId = jest.spyOn(window.FS, 'identify')

    await identify.identify?.(
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
        orgId: FakeOrgId,
        subscriptions: example
      })
      await identifyUser.load(Context.system(), {} as Analytics)
      const fsId = jest.spyOn(window.FS, 'identify')

      await identifyUser.identify?.(new Context({ type: 'identify', userId: 'id' }))
      expect(fsId).toHaveBeenCalledWith('id', {}, 'segment-browser-actions')
    }),
    it('should camelCase custom traits', async () => {
      const [_, identify] = await fullstory({
        orgId: FakeOrgId,
        subscriptions: example
      })
      await identify.load(Context.system(), {} as Analytics)
      const fsId = jest.spyOn(window.FS, 'identify')

      await identify.identify?.(
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
    const [_, identify] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await identify.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'setUserVars')

    await identify.identify?.(
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

  it('should set displayName correctly', async () => {
    const [_, identify] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await identify.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'identify')

    await identify.identify?.(
      new Context({
        type: 'identify',
        userId: 'userId',
        traits: {
          name: 'Hasbulla',
          email: 'thegoat@world',
          height: '50cm'
        }
      })
    )

    expect(fs).toHaveBeenCalledWith(
      'userId',
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

describe('#page', () => {
  it('sends page events to fullstory on "page" (category edition)', async () => {
    const [, , viewed] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await viewed.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'setVars')

    await viewed.page?.(
      new Context({
        type: 'page',
        category: 'Walruses',
        name: 'Walrus Page',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(fs).toHaveBeenCalledWith(
      'page',
      {
        pageName: 'Walruses',
        banana: '📞'
      },
      'segment-browser-actions'
    )
  })

  it('sends page events to fullstory on "page" (name edition)', async () => {
    const [, , viewed] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await viewed.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'setVars')

    await viewed.page?.(
      new Context({
        type: 'page',
        name: 'Walrus Page',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(fs).toHaveBeenCalledWith(
      'page',
      {
        pageName: 'Walrus Page',
        banana: '📞'
      },
      'segment-browser-actions'
    )
  })

  it('sends page events to fullstory on "page" (no pageName edition)', async () => {
    const [, , viewed] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await viewed.load(Context.system(), {} as Analytics)
    const fs = jest.spyOn(window.FS, 'setVars')

    await viewed.page?.(
      new Context({
        type: 'page',
        properties: {
          banana: '📞',
          keys: '🗝🔑'
        }
      })
    )

    expect(fs).toHaveBeenCalledWith(
      'page',
      {
        banana: '📞',
        keys: '🗝🔑'
      },
      'segment-browser-actions'
    )
  })
})
