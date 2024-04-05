import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

const testData = {
  event: {
    type: 'track',
    event: 'Test Event',
    properties: {
      email: 'test@iterable.com'
    },
    traits: {},
    timestamp: '2024-02-26T16:53:08.910Z',
    sentAt: '2024-02-26T16:53:08.910Z',
    receivedAt: '2024-02-26T16:53:08.907Z',
    messageId: 'a82f52d9-d8ed-40a8-89e3-b9c04701a5f6',
    userId: 'user1234',
    anonymousId: 'anonId1234',
    context: {}
  },
  useDefaultMappings: false,
  settings: {
    environment: 'dev',
    org_id: 'yourUsername',
    api_key: 'yourPassword'
  },
  mapping: {
    topic: 'test-topic',
    payload: { '@path': '$.' }
  }
}

describe('Spiffy.send', () => {
  it('Sends payload to spiffy correctly', async () => {
    nock('https://segment-intake.dev.spiffy.ai').put(`/v1/intake`).reply(200, { ok: true })
    const response = await testDestination.testAction('send', testData as any)
    expect(response?.[0]?.data).toEqual({ ok: true })
  })
})
