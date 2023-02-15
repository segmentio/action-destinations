import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://sink.outfunnel.com'
const userId = '63d1535e64583e42bbc60662'
const apiToken = '5aef3rafgasfdsafadsfsdadasd'

describe('Outfunnel.trackEvent', () => {
  it('should update a user if the user already exists', async () => {
    const event = createTestEvent({ groupId: 'abc', traits: { name: 'example user', email: 'user@example.com' } })

    nock(endpoint)
      .post(`/events/segment/${userId}`)
      .query(true)
      .reply(200, { success: true })

    const responses = await testDestination.testAction('trackEvent', {
      settings: { userId, apiToken },
      event,
      mapping: { group_id: { '@path': '$.groupId' }, email: { '@path': '$.traits.email' } },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toContain(
      `{"type":"track","event_name":"Test Event","user_id":"user1234","group_id":"abc","email":"user@example.com"`
    )
  })
})
