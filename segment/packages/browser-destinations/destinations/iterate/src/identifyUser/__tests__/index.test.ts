import { Analytics, Context } from '@segment/analytics-next'
import iterateDestination, { destination } from '../../index'

describe('Iterate.identifyUser', () => {
  it('Should call identify', async () => {
    const [identifyEvent] = await iterateDestination({
      apiKey: '123',
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
            }
          }
        }
      ]
    })

    destination.actions.identifyUser.perform = jest.fn()
    const identifySpy = jest.spyOn(destination.actions.identifyUser, 'perform')
    await identifyEvent.load(Context.system(), {} as Analytics)

    await identifyEvent.identify?.(
      new Context({
        type: 'identify',
        userId: '123abc',
        traits: {
          foo: 'bar'
        }
      })
    )

    expect(identifySpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          userId: '123abc',
          traits: {
            foo: 'bar'
          }
        }
      })
    )
  })
})
