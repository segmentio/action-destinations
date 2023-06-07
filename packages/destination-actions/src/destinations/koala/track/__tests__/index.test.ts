import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Koala.track', () => {
  it('forwards the segment event in the `events` field', async () => {
    nock(`https://api2.getkoala.com/web/projects/testId`).post('/batch').reply(204, {})

    const responses = await testDestination.testAction('track', {
      mapping: {
        event: 'test-track',
        sent_at: '2023-03-03T00:00:00.000Z',
        message_id: 'message_id',
        context: {},
        properties: {
          banana: 'phone'
        }
      },
      settings: { public_key: 'testId' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')
    expect(payload).toMatchObject({
      events: [
        {
          type: 'track',
          event: 'test-track',
          sent_at: '2023-03-03T00:00:00.000Z',
          message_id: 'message_id',
          context: {},
          properties: { banana: 'phone' }
        }
      ]
    })
  })
})
