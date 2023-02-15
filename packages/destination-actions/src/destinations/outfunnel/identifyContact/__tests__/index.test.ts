import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://sink.outfunnel.com'
const userId = '63d1535e64583e42bbc60662'
const apiToken = '5aef3rafgasfdsafadsfsdadasd'

describe('Outfunnel.identifyContact', () => {
  it('should create or update user in Outfunnel', async () => {
    const event = createTestEvent({ type: 'identify', traits: { name: 'example user', email: 'user@example.com' } })


    nock(endpoint)
      .post(`/events/segment/${userId}`)
      .query(true)
      .reply(200, { success: true })

    const responses = await testDestination.testAction('identifyContact', {
      settings: { userId, apiToken },
      event,
      mapping: { role: { '@path': '$.traits.role' }, email: { '@path': '$.traits.email' } },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toContain(
      `{"type":"identify","user_id":"user1234","anonymous_id":"anonId1234","email":"user@example.com"`
    )
  })
})
