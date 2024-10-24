import { Analytics, Context } from '@segment/analytics-next'
import fullstory from '..'
import trackEventV2 from '../trackEventV2'
import identifyUserV2 from '../identifyUserV2'
import viewedPageV2 from '../viewedPageV2'
import { FS as FSApi } from '../types'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { defaultValues } from '@segment/actions-core/*'

jest.mock('@fullstory/browser', () => ({
  ...jest.requireActual('@fullstory/browser'),
  init: () => {
    window.FS = jest.fn() as unknown as FSApi
  }
}))

const FakeOrgId = 'asdf-qwer'

const example: Subscription[] = [
  {
    partnerAction: 'trackEventV2',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEventV2.fields)
  },
  {
    partnerAction: 'identifyUserV2',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: defaultValues(identifyUserV2.fields)
  },
  {
    partnerAction: 'viewedPageV2',
    name: 'Viewed Page',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: defaultValues(viewedPageV2.fields)
  }
]

describe('#track', () => {
  it('sends record events to fullstory on "event"', async () => {
    const [event] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await event.load(Context.system(), {} as Analytics)

    await event.track?.(
      new Context({
        type: 'track',
        event: 'hello!',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(window.FS).toHaveBeenCalledWith(
      'trackEvent',
      {
        name: 'hello!',
        properties: {
          banana: '📞'
        }
      },
      'segment-browser-actions'
    )
  })
})

describe('#identify', () => {
  it('should default to anonymousId', async () => {
    const [_, identifyUser] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await identifyUser.load(Context.system(), {} as Analytics)

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon',
        traits: {
          testProp: false
        }
      })
    )

    expect(window.FS).toHaveBeenCalledTimes(1)
    expect(window.FS).toHaveBeenCalledWith(
      'setProperties',
      { type: 'user', properties: { segmentAnonymousId: 'anon', testProp: false } },
      'segment-browser-actions'
    )
  })

  it('should send an id', async () => {
    const [_, identifyUser] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })
    await identifyUser.load(Context.system(), {} as Analytics)

    await identifyUser.identify?.(new Context({ type: 'identify', userId: 'id' }))
    expect(window.FS).toHaveBeenCalledWith('setIdentity', { uid: 'id', properties: {} }, 'segment-browser-actions')
  })

  it('can set user vars', async () => {
    const [_, identifyUser] = await fullstory({
      orgId: FakeOrgId,
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

    expect(window.FS).toHaveBeenCalledWith(
      'setProperties',
      {
        type: 'user',
        properties: {
          displayName: 'Hasbulla',
          email: 'thegoat@world',
          height: '50cm',
          name: 'Hasbulla'
        }
      },
      'segment-browser-actions'
    )
  })

  it('should set displayName correctly', async () => {
    const [_, identifyUser] = await fullstory({
      orgId: FakeOrgId,
      subscriptions: example
    })

    await identifyUser.load(Context.system(), {} as Analytics)

    await identifyUser.identify?.(
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

    expect(window.FS).toHaveBeenCalledWith(
      'setIdentity',
      {
        uid: 'userId',
        properties: {
          displayName: 'Hasbulla',
          email: 'thegoat@world',
          height: '50cm',
          name: 'Hasbulla'
        }
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

    expect(window.FS).toHaveBeenCalledWith(
      'setProperties',
      {
        type: 'page',
        properties: {
          pageName: 'Walruses',
          banana: '📞'
        }
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

    await viewed.page?.(
      new Context({
        type: 'page',
        name: 'Walrus Page',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(window.FS).toHaveBeenCalledWith(
      'setProperties',
      {
        type: 'page',
        properties: {
          pageName: 'Walrus Page',
          banana: '📞'
        }
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

    await viewed.page?.(
      new Context({
        type: 'page',
        properties: {
          banana: '📞',
          keys: '🗝🔑'
        }
      })
    )

    expect(window.FS).toHaveBeenCalledWith(
      'setProperties',
      {
        type: 'page',
        properties: {
          banana: '📞',
          keys: '🗝🔑'
        }
      },
      'segment-browser-actions'
    )
  })
})
