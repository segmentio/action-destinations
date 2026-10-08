import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BULK_IMPORT_ENDPOINT, GET_LEADS_ENDPOINT, REMOVE_USERS_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const LIST_ID = '12345'
const API_ENDPOINT = 'https://123-ABC-456.mktorest.com'
const settings = {
  client_id: '1234',
  client_secret: '1234',
  api_endpoint: API_ENDPOINT,
  folder_name: 'Test Folder'
}

const mapping = {
  external_id: { '@path': '$.context.personas.external_audience_id' },
  lookup_field: 'email',
  data: {
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  },
  field_value: {
    '@if': {
      exists: { '@path': '$.context.traits.email' },
      then: { '@path': '$.context.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  },
  enable_batching: true,
  batch_size: 300,
  event_name: { '@path': '$.event' }
}

function membershipEvent(email: string, membership: boolean) {
  return createTestEvent({
    event: 'Test Event',
    type: 'track',
    properties: {
      my_audience: membership,
      email
    },
    context: {
      traits: { email },
      personas: {
        computation_class: 'audience',
        computation_key: 'my_audience',
        external_audience_id: LIST_ID
      }
    }
  })
}

describe('MarketoStaticLists.syncList', () => {
  beforeEach(() => nock.cleanAll())

  it('calls addToList when audienceMembership is true', async () => {
    const scope = nock(API_ENDPOINT)
      .post(BULK_IMPORT_ENDPOINT.replace('externalId', LIST_ID).replace('fieldToLookup', 'email'))
      .reply(200, { success: true })

    const r = await testDestination.testAction('syncList', {
      event: membershipEvent('add-user@example.com', true),
      settings,
      mapping
    })

    expect(r[0].status).toEqual(200)
    expect(scope.isDone()).toBe(true)
  })

  it('calls removeFromList when audienceMembership is false', async () => {
    const getLeadsScope = nock(API_ENDPOINT)
      .get(
        GET_LEADS_ENDPOINT.replace('field', 'email').replace(
          'emailsToFilter',
          encodeURIComponent('remove-user@example.com')
        )
      )
      .reply(200, { success: true, result: [{ id: 42 }] })

    const deleteLeadsScope = nock(API_ENDPOINT)
      .delete(REMOVE_USERS_ENDPOINT.replace('listId', LIST_ID).replace('idsToDelete', '42'))
      .reply(200, { success: true })

    const r = await testDestination.testAction('syncList', {
      event: membershipEvent('remove-user@example.com', false),
      settings,
      mapping
    })

    expect(r[0].status).toEqual(200)
    expect(r[1].status).toEqual(200)
    expect(getLeadsScope.isDone()).toBe(true)
    expect(deleteLeadsScope.isDone()).toBe(true)
  })

  it('throws PayloadValidationError when audienceMembership is not a boolean', async () => {
    // No context.personas at all, and no __segment_internal_sync_mode in the mapping =>
    // resolveAudienceMembership (core) returns undefined for this event.
    const event = createTestEvent({
      event: 'Test Event',
      type: 'track',
      properties: { email: 'no-membership@example.com' },
      context: { traits: { email: 'no-membership@example.com' } }
    })

    await expect(
      testDestination.testAction('syncList', {
        event,
        settings,
        mapping
      })
    ).rejects.toThrow('Audience Membership must be a boolean')
  })
})
