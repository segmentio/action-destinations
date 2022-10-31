import { Analytics, Context } from '@segment/analytics-next'
import commandBarDestination, { destination } from '../../index'

describe('Commandbar.identifyUser', () => {
  it('Should call identify', async () => {
    const [identifyUserPlugin] = await commandBarDestination({
      orgId: '05f077f2',
      subscriptions: [
        {
          partnerAction: 'identifyUser',
          name: 'Identify User',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {
            userId: {
              '@path': '$.userId'
            },
            traits: {
              '@path': '$.traits'
            },
            hmac: {
              '@path': '$.context.CommandBar.hmac'
            }
          }
        }
      ]
    })

    destination.actions.identifyUser.perform = jest.fn()
    const identifySpy = jest.spyOn(destination.actions.identifyUser, 'perform')
    await identifyUserPlugin.load(Context.system(), {} as Analytics)

    await identifyUserPlugin.identify?.(
      new Context({
        type: 'identify',
        userId: 'test-user',
        traits: {
          foo: 'bar'
        },
        context: {
          CommandBar: {
            hmac: 'x'
          }
        }
      })
    )

    expect(identifySpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          userId: 'test-user',
          hmac: 'x',
          traits: {
            foo: 'bar'
          }
        }
      })
    )
  })
})
