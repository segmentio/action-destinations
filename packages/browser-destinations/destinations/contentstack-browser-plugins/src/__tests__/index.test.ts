import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import contentstack, { destination } from '../index'
import { UniversalStorage } from '@segment/analytics-next'

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

beforeEach(async () => {
  ajs = new Analytics({
    writeKey: 'yyuiuyiuyiuyi'
  })

  ajs.reset()

  const storage = ajs.storage as UniversalStorage<Record<string, string>>

  storage.set('traits', JSON.stringify({ email: 'test@test.com' }))
})

describe('contentstack', () => {
  test('should not populate integrations.Contentstack.createAttributes if no new traits detected', async () => {
    const [event] = await contentstack({ subscriptions: example })

    jest.spyOn(destination.actions.contentstackPlugin, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const ctx = await event.identify?.(
      new Context({
        type: 'identify',
        userId: '2234',
        traits: {
          //email: 'test@test.com'
        }
      })
    )
    console.log(JSON.stringify(ctx, null, 2))

    expect(destination.actions.contentstackPlugin.perform).toHaveBeenCalled()
    expect(ctx).not.toBeUndefined()
    const csIntegfrationObj = ctx?.event?.integrations?.Contentstack
    expect(typeof csIntegfrationObj === 'object' && 'createAttributes' in csIntegfrationObj).toEqual(false)
  })

  test('should populate integrations.Contentstack.createAttributes = true if new traits detected', async () => {
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
