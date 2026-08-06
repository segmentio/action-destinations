import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../../memora/versioning-info'
import { BASE_URL } from '../../memora/constants'

const testDestination = createTestIntegration(Destination)

const defaultSettings = {
  username: 'test-api-key',
  password: 'test-api-secret',
  twilioAccount: 'AC1234567890'
}

const defaultMapping = {
  memora_store: 'test-store-id',
  profile_identifiers: {
    'Contact.$.email': { '@path': '$.traits.email' },
    'Contact.$.phone': { '@path': '$.traits.phone' }
  },
  profile_traits: {
    'Contact.$.firstName': { '@path': '$.traits.first_name' }
  }
}

describe('Memora Internal (actions-memora-internal)', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should not include segment_traits_by_field or segment_identifiers_by_field in the outbound request', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user-123',
      traits: { email: 'john@example.com', phone: '+1-555-0100', first_name: 'John' }
    })

    let capturedBody: Record<string, unknown> = {}
    let nockIntercepted = false

    nock(BASE_URL)
      .put(`/${API_VERSION}/Stores/test-store-id/Profiles/Bulk`, (body) => {
        capturedBody = body as Record<string, unknown>
        nockIntercepted = true
        return true
      })
      .reply(202)

    const responses = await testDestination.testAction('upsertProfile', {
      event,
      settings: defaultSettings,
      mapping: {
        ...defaultMapping,
        segment_traits_by_field: { 'Contact.$.firstName': ['first_name'] },
        segment_identifiers_by_field: { 'Contact.$.email': ['email'] }
      },
      useDefaultMappings: true
    })

    expect(nockIntercepted).toBe(true)
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)

    const requestBodyStr = JSON.stringify(capturedBody)
    expect(requestBodyStr).not.toContain('segment_traits_by_field')
    expect(requestBodyStr).not.toContain('segment_identifiers_by_field')
  })
})
