import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import contentstack, { destination } from '../index'
import { storageFallback } from '../contentstackPlugin/utils'

const example: Subscription[] = [
  {
    partnerAction: 'contentstackPlugin',
    name: 'Contentstack Browser Plugin',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      traits: { '@path': '$.traits' }
    }
  }
]

let ajs: Analytics

beforeEach(async () => {})

describe('contentstack', () => {
  test('should populate integrations.Contentstack.createAttributes = false if no new traits detected', async () => {
    ajs = new Analytics({
      writeKey: 'yyuiuyiuyiuyi'
    })

    ajs.reset()

    const storage = storageFallback // note: UniversalStorage doesn't seem to work so well in tests

    storage.set('traits', JSON.stringify({ email: 'test@messer.com' }))

    const [event] = await contentstack({ subscriptions: example })

    jest.spyOn(destination.actions.contentstackPlugin, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const ctx = await event.identify?.(
      new Context({
        type: 'identify',
        userId: '123',
        traits: {
          email: 'test@test.com'
        }
      })
    )
    console.log(JSON.stringify(ctx, null, 2))

    expect(destination.actions.contentstackPlugin.perform).toHaveBeenCalled()
    expect(ctx).not.toBeUndefined()

    if (!ctx || !ctx?.event || !ctx.event.integrations) {
      throw new Error('integrations is undefined')
    }
    const integrationsObj: { createAttributes: boolean } = ctx.event.integrations['Contentstack'] as {
      createAttributes: boolean
    }

    expect(integrationsObj.createAttributes).toEqual(false)
  })

  test('should populate integrations.Contentstack.createAttributes = true if new traits detected', async () => {
    ajs = new Analytics({
      writeKey: 'yyuiuyiuyiuyi'
    })

    ajs.reset()

    const storage = storageFallback // note: UniversalStorage doesn't seem to work so well in tests

    storage.set('traits', JSON.stringify({ email: 'test@messer.com' }))

    const [event] = await contentstack({ subscriptions: example })

    jest.spyOn(destination.actions.contentstackPlugin, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const ctx = await event.identify?.(
      new Context({
        type: 'identify',
        userId: '123',
        traits: {
          email: 'test@test.com',
          first_name: 'Jimmy'
        }
      })
    )
    console.log(JSON.stringify(ctx, null, 2))

    expect(destination.actions.contentstackPlugin.perform).toHaveBeenCalled()
    expect(ctx).not.toBeUndefined()

    if (!ctx || !ctx?.event || !ctx.event.integrations) {
      throw new Error('integrations is undefined')
    }
    const integrationsObj: { createAttributes: boolean } = ctx.event.integrations['Contentstack'] as {
      createAttributes: boolean
    }

    expect(integrationsObj.createAttributes).toEqual(true)
  })
})
