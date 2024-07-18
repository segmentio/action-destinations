import { Analytics, Context } from '@segment/analytics-next'

import sendUserData from '..'
import { JimoSDK } from '../../types'
import { Payload } from '../generated-types'

describe('Jimo - Send User Data', () => {
  test('user id', async () => {
    const client = {
      push: jest.fn()
    } as any as JimoSDK

    const context = new Context({
      type: 'identify'
    })

    await sendUserData.perform(client as any as JimoSDK, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        userId: 'u1'
      } as Payload
    })

    expect(client.push).toHaveBeenCalled()
    expect(client.push).toHaveBeenCalledWith(['do', 'identify', ['u1', expect.any(Function)]])
  })
  test('user id then email and attributes', async () => {
    const client = {
      push: jest.fn()
    } as any as JimoSDK

    const context = new Context({
      type: 'identify'
    })

    await sendUserData.perform(client as any as JimoSDK, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        userId: 'u1',
        email: 'john@doe.com',
        traits: {
          foo: 'bar'
        }
      } as Payload
    })

    expect(client.push).toHaveBeenCalled()
    expect(client.push).toHaveBeenCalledWith(['do', 'identify', ['u1', expect.any(Function)]])
  })
  test('user email', async () => {
    const client = {
      push: jest.fn()
    } as any as JimoSDK

    const context = new Context({
      type: 'identify'
    })

    await sendUserData.perform(client as any as JimoSDK, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        email: 'foo@bar.com'
      } as Payload
    })

    expect(client.push).toHaveBeenCalled()
    expect(client.push).toHaveBeenCalledWith(['set', 'user:email', ['foo@bar.com']])
  })
  test('user traits', async () => {
    const client = {
      push: jest.fn()
    } as any as JimoSDK

    const context = new Context({
      type: 'identify'
    })

    await sendUserData.perform(client as any as JimoSDK, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        traits: {
          trait1: true,
          trait2: 'foo',
          trait3: 1
        }
      } as Payload
    })

    expect(client.push).toHaveBeenCalled()
    expect(client.push).toHaveBeenCalledWith([
      'set',
      'user:attributes',
      [
        {
          trait1: true,
          trait2: 'foo',
          trait3: 1
        },
        false,
        true
      ]
    ])
  })
  test('user traits with experience refetching', async () => {
    const client = {
      push: jest.fn()
    } as any as JimoSDK

    const context = new Context({
      type: 'identify'
    })

    await sendUserData.perform(client as any as JimoSDK, {
      settings: { projectId: 'unk', refetchExperiencesOnTraitsUpdate: true },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        traits: {
          trait1: true,
          trait2: 'foo',
          trait3: 1
        }
      } as Payload
    })

    expect(client.push).toHaveBeenCalled()
    expect(client.push).toHaveBeenCalledWith([
      'set',
      'user:attributes',
      [
        {
          trait1: true,
          trait2: 'foo',
          trait3: 1
        },
        true,
        true
      ]
    ])
  })
})
