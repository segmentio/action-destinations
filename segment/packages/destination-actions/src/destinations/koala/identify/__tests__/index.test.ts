import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Koala.identify', () => {
  it('forwards the segment identify call in the `identifies` field', async () => {
    nock(`https://api2.getkoala.com/web/projects/testId`).post('/batch').reply(204, {})

    const responses = await testDestination.testAction('identify', {
      settings: { public_key: 'testId' },
      mapping: {
        device_ip: '192.168.0.1',
        email: 'netto@getkoala.com',
        traits: {
          vip: true,
          email: 'netto@getkoala.com'
        },
        sent_at: '2023-03-03T00:00:00.000Z',
        message_id: 'message_id',
        context: {}
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')
    expect(payload).toMatchObject({
      ip: '192.168.0.1',
      email: 'netto@getkoala.com',
      traits: {
        vip: true,
        email: 'netto@getkoala.com'
      },
      identifies: [
        {
          type: 'identify',
          sent_at: '2023-03-03T00:00:00.000Z',
          message_id: 'message_id',
          traits: { vip: true, email: 'netto@getkoala.com' },
          context: {}
        }
      ]
    })
  })
})
