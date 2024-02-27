import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination, { BASE_URL } from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iqm.postEvent', () => {
  it('should send an event', async () => {
    const event = createTestEvent({
      userId: '2d947e75-de80-4776-8e0e-4d645977d3df'
    })
    nock(`${BASE_URL}`)
      .post('')
      .query(true)
      .reply(200, {
        data: {
          postEvent: true
        }
      })

    const t = await testDestination.testAction('postEvent', {
      event,
      useDefaultMappings: false,
      mapping: {
        data: {
          '@path': '$.'
        }
      },
      settings: { pixel_id: 'my-pixel-id' }
    })

    expect(t[0].status).toBe(200)
  })
})
