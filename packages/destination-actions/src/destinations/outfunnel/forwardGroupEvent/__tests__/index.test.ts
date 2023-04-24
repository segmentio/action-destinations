import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://sink.outfunnel.com'
const userId = '63d1535e64583e42bbc60662'
const apiToken = '5aef3rafgasfdsafadsfsdadasd'

describe('Outfunnel.forwardGroupEvent', () => {
  it('should forward group event to Outfunnel', async () => {
    const event = createTestEvent({ type: 'group', traits: { name: 'example company' } })

    nock(endpoint)
      .post(`/events/segment/${userId}`)
      .query(true)
      .reply(200, { success: true })

    const responses = await testDestination.testAction('forwardGroupEvent', {
      settings: { userId, apiToken },
      event,
      mapping: { name: { '@path': '$.traits.name' } },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toContain(
      `{"action":"group","user_id":"user1234","anonymous_id":"anonId1234","group_name":"example company"`
    )
  })
})
