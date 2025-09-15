import { Analytics, Context } from '@segment/analytics-next'
import playerzero from '../../index'
import { subscriptions, TEST_PROJECT_ID } from '../../test-utils'

describe.skip('PlayerzeroWeb.identifyUser', () => {
  it('should keep anonymous users', async () => {
    const [_, identifyUser] = await playerzero({
      projectId: TEST_PROJECT_ID,
      subscriptions
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    const pzUserVars = jest.spyOn(window.playerzero, 'setUserVars')
    const pzIdentify = jest.spyOn(window.playerzero, 'identify')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'ghost',
        traits: {
          hello: 'world'
        }
      })
    )

    expect(pzUserVars).toHaveBeenCalled()
    expect(pzIdentify).not.toHaveBeenCalled()
    expect(pzUserVars).toHaveBeenCalledWith({
      segmentAnonymousId: 'ghost',
      hello: 'world'
    })
  })

  it('should identify a user with id', async () => {
    const [_, identifyUser] = await playerzero({
      projectId: TEST_PROJECT_ID,
      subscriptions
    })
    await identifyUser.load(Context.system(), {} as Analytics)
    const pzIdentify = jest.spyOn(window.playerzero, 'identify')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        userId: 'id'
      })
    )
    expect(pzIdentify).toHaveBeenCalledWith('id', {})
  })

  it.skip('sets identity and traits', async () => {
    const [_, identifyUser] = await playerzero({
      projectId: TEST_PROJECT_ID,
      subscriptions
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    const pzIdentify = jest.spyOn(window.playerzero, 'identify')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        userId: 'id',
        anonymousId: 'ghost',
        traits: {
          name: 'Joe',
          email: 'billy@bob.com'
        }
      })
    )

    expect(pzIdentify).toHaveBeenCalledWith('id', {
      name: 'Joe',
      email: 'billy@bob.com',
      segmentAnonymousId: 'ghost'
    })
  })
})
