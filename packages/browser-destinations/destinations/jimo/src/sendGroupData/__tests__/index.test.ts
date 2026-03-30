import { Analytics, Context } from '@segment/analytics-next'
import sendGroupData from '..'
import { JimoClient } from '../../types'
import { Payload } from '../generated-types'

describe('Jimo - Send Group Data', () => {
  test('set user:group is called with groupId and traits', async () => {
    const mockedPush = jest.fn()
    const client = {
      client() {
        return { push: mockedPush }
      }
    } as any as JimoClient

    const context = new Context({
      type: 'group'
    })

    await sendGroupData.perform(client as any as JimoClient, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        groupId: 'g1',
        traits: {
          name: 'Acme Corp',
          plan: 'enterprise',
          industry: 'Technology'
        }
      } as Payload
    })

    expect(client.client().push).toHaveBeenCalled()
    expect(client.client().push).toHaveBeenCalledWith([
      'set',
      'user:group',
      [
        {
          groupId: 'g1',
          traits: {
            name: 'Acme Corp',
            plan: 'enterprise',
            industry: 'Technology'
          }
        },
        { fromSegment: true }
      ]
    ])
  })

  test('set user:group is called with groupId only (no traits)', async () => {
    const mockedPush = jest.fn()
    const client = {
      client() {
        return { push: mockedPush }
      }
    } as any as JimoClient

    const context = new Context({
      type: 'group'
    })

    await sendGroupData.perform(client as any as JimoClient, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        groupId: 'g2'
      } as Payload
    })

    expect(client.client().push).toHaveBeenCalled()
    expect(client.client().push).toHaveBeenCalledWith([
      'set',
      'user:group',
      [
        {
          groupId: 'g2',
          traits: {}
        },
        { fromSegment: true }
      ]
    ])
  })

  test('set user:group is called with groupId and empty traits object', async () => {
    const mockedPush = jest.fn()
    const client = {
      client() {
        return { push: mockedPush }
      }
    } as any as JimoClient

    const context = new Context({
      type: 'group'
    })

    await sendGroupData.perform(client as any as JimoClient, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        groupId: 'g3',
        traits: {}
      } as Payload
    })

    expect(client.client().push).toHaveBeenCalled()
    expect(client.client().push).toHaveBeenCalledWith([
      'set',
      'user:group',
      [
        {
          groupId: 'g3',
          traits: {}
        },
        { fromSegment: true }
      ]
    ])
  })
})
