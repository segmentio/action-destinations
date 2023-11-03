import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://sink.outfunnel.com'
const userId = '63d1535e64583e42bbc60662'
const apiToken = '5aef3rafgasfdsafadsfsdadasd'

describe('Outfunnel.forwardTrackEvent', () => {
  it('should forward track event to outfunnel', async () => {
    const event = createTestEvent({ groupId: 'abc', traits: { name: 'John Doe', email: 'user@example.com' } })

    nock(endpoint)
      .post(`/events/segment/${userId}`)
      .query(true)
      .reply(200, { success: true })

    const responses = await testDestination.testAction('forwardTrackEvent', {
      settings: { userId, apiToken },
      event,
      mapping: { group_id: { '@path': '$.groupId' }, email: { '@path': '$.traits.email' } },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toContain(
      `{"action":"track","event_name":"Test Event","user_id":"user1234","anonymous_id":"anonId1234","group_id":"abc","email":"user@example.com"`
    )
  })
})
