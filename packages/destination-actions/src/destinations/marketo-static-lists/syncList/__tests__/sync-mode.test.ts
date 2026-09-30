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

const baseMapping = {
  external_id: LIST_ID,
  lookup_field: 'email',
  data: { email: { '@path': '$.properties.email' } },
  field_value: { '@path': '$.properties.email' },
  enable_batching: true,
  batch_size: 300,
  event_name: { '@path': '$.event' }
}

// A RETL/database-table row event: plain track event named 'new'/'updated'/'deleted', no
// context.personas at all. Add vs. remove is derived purely from syncMode + event name via
// core's retlAudienceMembership (packages/core/src/audience-membership.ts) - which only runs
// because syncList declares a top-level `syncMode` field (action.ts only reads
// `__segment_internal_sync_mode` when `this.definition.syncMode` is set).
function retlRowEvent(event: 'new' | 'updated' | 'deleted', email: string) {
  return createTestEvent({
    event,
    type: 'track',
    properties: { email }
  })
}

describe('MarketoStaticLists.syncList - syncMode-driven RETL audience membership', () => {
  beforeEach(() => nock.cleanAll())

  describe('syncMode: upsert', () => {
    it('treats both "new" and "updated" rows as adds', async () => {
      const events = [retlRowEvent('new', 'new-row@example.com'), retlRowEvent('updated', 'updated-row@example.com')]

      const addScope = nock(API_ENDPOINT)
        .post(BULK_IMPORT_ENDPOINT.replace('externalId', LIST_ID).replace('fieldToLookup', 'email'))
        .reply(200, { success: true })

      const responses = await testDestination.executeBatch('syncList', {
        events,
        settings,
        mapping: { ...baseMapping, __segment_internal_sync_mode: 'upsert' }
      })

      expect(responses).toMatchObject([
        { status: 200, sent: 'new-row@example.com' },
        { status: 200, sent: 'updated-row@example.com' }
      ])
      expect(addScope.isDone()).toBe(true)
    })
  })

  describe('syncMode: mirror', () => {
    it('treats a "new" row as an add and a "deleted" row as a remove', async () => {
      const events = [retlRowEvent('new', 'new-row@example.com'), retlRowEvent('deleted', 'deleted-row@example.com')]

      const addScope = nock(API_ENDPOINT)
        .post(BULK_IMPORT_ENDPOINT.replace('externalId', LIST_ID).replace('fieldToLookup', 'email'))
        .reply(200, { success: true })

      const getLeadsScope = nock(API_ENDPOINT)
        .get(
          GET_LEADS_ENDPOINT.replace('field', 'email').replace(
            'emailsToFilter',
            encodeURIComponent('deleted-row@example.com')
          )
        )
        .reply(200, { success: true, result: [{ id: 7 }] })

      const deleteLeadsScope = nock(API_ENDPOINT)
        .delete(REMOVE_USERS_ENDPOINT.replace('listId', LIST_ID).replace('idsToDelete', '7'))
        .reply(200, { success: true })

      const responses = await testDestination.executeBatch('syncList', {
        events,
        settings,
        mapping: { ...baseMapping, __segment_internal_sync_mode: 'mirror' }
      })

      expect(responses).toMatchObject([
        { status: 200, sent: 'new-row@example.com' },
        { status: 200, sent: 'id=7' }
      ])
      expect(addScope.isDone()).toBe(true)
      expect(getLeadsScope.isDone()).toBe(true)
      expect(deleteLeadsScope.isDone()).toBe(true)
    })
  })

  it('is unresolvable (and rejected) when __segment_internal_sync_mode is missing from the mapping', async () => {
    // Same event shape as the "upsert"/"mirror" cases above, but the mapping carries no sync
    // mode at all - proving the syncMode field is load-bearing, not cosmetic: without it, core's
    // retlAudienceMembership never runs and this RETL-style event has no other resolution path.
    await expect(
      testDestination.testAction('syncList', {
        event: retlRowEvent('new', 'no-sync-mode@example.com'),
        settings,
        mapping: baseMapping
      })
    ).rejects.toThrow('Audience Membership must be a boolean')
  })
})
