import { Analytics, Context } from '@segment/analytics-next'
import sendTrackEvent from '..'
import { JimoSDK } from '../../types'
import { Payload } from '../generated-types'

describe('Jimo - Send Track Event', () => {
  test('do:segmentio:track is called', async () => {
    const client = {
      push: jest.fn()
    } as any as JimoSDK

    const context = new Context({
      type: 'track'
    })

    await sendTrackEvent.perform(client as any as JimoSDK, {
      settings: { projectId: 'unk' },
      analytics: jest.fn() as any as Analytics,
      context: context,
      payload: {
        messageId: '42',
        timestamp: 'timestamp-as-iso-string',
        userId: 'u1',
        anonymousId: 'a1',
        event_name: 'foo',
        properties: {
          foo: 'bar'
        }
      } as Payload
    })

    expect(client.push).toHaveBeenCalled()
    expect(client.push).toHaveBeenCalledWith([
      'do',
      'segmentio:track',
      [
        {
          event: 'foo',
          messageId: '42',
          timestamp: 'timestamp-as-iso-string',
          receivedAt: 'timestamp-as-iso-string',
          userId: 'u1',
          anonymousId: 'a1',
          properties: {
            foo: 'bar'
          }
        }
      ]
    ])
  })
})
