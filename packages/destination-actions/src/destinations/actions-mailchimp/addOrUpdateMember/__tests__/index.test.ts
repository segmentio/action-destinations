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

describe('actions-mailchimp addOrUpdateMember', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('upserts a member via PUT with the MD5 subscriber hash', async () => {
    const email = 'jane.doe@example.com'
    const hash = getSubscriberHash(email)

    nock(BASE_URL)
      .put(`/lists/list123/members/${hash}`, {
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields: { FNAME: 'Jane', LNAME: 'Doe' }
      })
      .reply(200, { id: hash, email_address: email, status: 'subscribed' })

    const event = createTestEvent({
      type: 'identify',
      traits: { email, firstName: 'Jane', lastName: 'Doe' }
    })

    const responses = await testDestination.testAction('addOrUpdateMember', {
      event,
      settings,
      mapping: {
        email_address: { '@path': '$.traits.email' },
        status_if_new: 'subscribed',
        merge_fields: { FNAME: 'Jane', LNAME: 'Doe' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('throws a PayloadValidationError when the email is missing', async () => {
    const event = createTestEvent({ type: 'identify', traits: {} })

    await expect(
      testDestination.testAction('addOrUpdateMember', {
        event,
        settings,
        mapping: {
          email_address: '',
          status_if_new: 'subscribed'
        }
      })
    ).rejects.toThrow("The root value is missing the required field 'email_address'.")
  })

  it('sends a batch of members to POST /lists/{list_id}', async () => {
    nock(BASE_URL).post('/lists/list123').reply(200, { total_created: 2, total_updated: 0, error_count: 0, errors: [] })

    const events = [
      createTestEvent({ type: 'identify', traits: { email: 'a@example.com' } }),
      createTestEvent({ type: 'identify', traits: { email: 'b@example.com' } })
    ]

    const responses = await testDestination.testBatchAction('addOrUpdateMember', {
      events,
      settings,
      mapping: {
        email_address: { '@path': '$.traits.email' },
        status_if_new: 'subscribed',
        enable_batching: true
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
