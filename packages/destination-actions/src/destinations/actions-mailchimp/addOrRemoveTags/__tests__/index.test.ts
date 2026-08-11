import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { getSubscriberHash } from '../../utils'

const testDestination = createTestIntegration(Destination)

const settings = {
  apiKey: 'test-api-key-us6',
  audienceId: 'list123'
}

const BASE_URL = 'https://us6.api.mailchimp.com/3.0'

describe('actions-mailchimp addOrRemoveTags', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('posts active and inactive tags for the member', async () => {
    const email = 'jane.doe@example.com'
    const hash = getSubscriberHash(email)

    nock(BASE_URL)
      .post(`/lists/list123/members/${hash}/tags`, {
        tags: [
          { name: 'Pro Plan', status: 'active' },
          { name: 'Trial Converted', status: 'active' },
          { name: 'Free Trial', status: 'inactive' }
        ]
      })
      .reply(204)

    const event = createTestEvent({
      type: 'track',
      event: 'Trial Converted',
      properties: { email }
    })

    const responses = await testDestination.testAction('addOrRemoveTags', {
      event,
      settings,
      mapping: {
        email: { '@path': '$.properties.email' },
        tags: [{ name: 'Pro Plan', status: 'active' }],
        tags_to_add: { '@path': '$.event' },
        tags_to_remove: ['Free Trial']
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
  })

  it('surfaces a clear error when the member does not exist (404)', async () => {
    const email = 'ghost@example.com'
    const hash = getSubscriberHash(email)

    nock(BASE_URL).post(`/lists/list123/members/${hash}/tags`).reply(404, { title: 'Resource Not Found' })

    const event = createTestEvent({ type: 'track', event: 'Some Event', properties: { email } })

    await expect(
      testDestination.testAction('addOrRemoveTags', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.properties.email' },
          tags_to_add: ['Some Event']
        }
      })
    ).rejects.toThrow('Audience member not found')
  })
})
