import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://sink.outfunnel.com'
const userId = '63d1535e64583e42bbc60662'
const apiToken = '5aef3rafgasfdsafadsfsdadasd'

describe('Outfunnel.groupIdentifyContact', () => {
  it('should create or update an organization', async () => {
    const event = createTestEvent({ type: 'group', traits: { name: 'example user', email: 'user@example.com' } })

    nock(endpoint)
      .post(`/events/segment/${userId}`)
      .query(true)
      .reply(200, { success: true })

    const responses = await testDestination.testAction('groupIdentifyContact', {
      settings: { userId, apiToken },
      event,
      mapping: { role: { '@path': '$.traits.role' }, email: { '@path': '$.traits.email' } },
      useDefaultMappings: true
    })

    console.log(responses[0].options.body)

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toContain(
      `{"type":"group","user_id":"user1234","anonymous_id":"anonId1234","email":"user@example.com"`
    )
  })
})
