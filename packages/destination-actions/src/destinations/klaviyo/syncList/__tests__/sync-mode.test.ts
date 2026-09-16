import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../config'
import { NO_LIST_ID_ERROR } from '../functions'

const testDestination = createTestIntegration(Destination)

const settings = { api_key: 'fake-api-key' }
const listId = 'XYZABC'

// A RETL/database-table row event: plain track event named 'new'/'updated'/'deleted', no
// context.personas at all. Add vs. remove is derived purely from syncMode + event name via
// core's retlAudienceMembership - which only runs because syncList declares a top-level
// `syncMode` field (action.ts only reads `__segment_internal_sync_mode` when
// `this.definition.syncMode` is set).
function retlRowEvent(event: 'new' | 'updated' | 'deleted', email: string) {
  return createTestEvent({ event, type: 'track', properties: { email } })
}

describe('Klaviyo.syncList - syncMode-driven RETL audience membership', () => {
  beforeEach(() => nock.cleanAll())

  describe('syncMode: upsert', () => {
    it('treats both "new" and "updated" rows as adds', async () => {
      const newEmail = 'new-row@example.com'
      const updatedEmail = 'updated-row@example.com'

      nock(API_URL)
        .post('/profiles/', { data: { type: 'profile', attributes: { email: newEmail } } })
        .reply(200, { data: { id: 'PROFILE1' } })
      nock(`${API_URL}/lists/${listId}`)
        .post('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE1' }] })
        .reply(200, {})

      const rNew = await testDestination.testAction('syncList', {
        event: retlRowEvent('new', newEmail),
        settings,
        mapping: { list_id: listId, email: newEmail, __segment_internal_sync_mode: 'upsert' }
      })
      expect(rNew[0].status).toBe(200)

      nock(API_URL)
        .post('/profiles/', { data: { type: 'profile', attributes: { email: updatedEmail } } })
        .reply(200, { data: { id: 'PROFILE2' } })
      nock(`${API_URL}/lists/${listId}`)
        .post('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE2' }] })
        .reply(200, {})

      const rUpdated = await testDestination.testAction('syncList', {
        event: retlRowEvent('updated', updatedEmail),
        settings,
        mapping: { list_id: listId, email: updatedEmail, __segment_internal_sync_mode: 'upsert' }
      })
      expect(rUpdated[0].status).toBe(200)
    })
  })

  describe('syncMode: mirror', () => {
    it('treats a "new" row as an add and a "deleted" row as a remove', async () => {
      const addEmail = 'new-row@example.com'
      const removeEmail = 'deleted-row@example.com'

      nock(API_URL)
        .post('/profiles/', { data: { type: 'profile', attributes: { email: addEmail } } })
        .reply(200, { data: { id: 'PROFILE1' } })
      nock(`${API_URL}/lists/${listId}`)
        .post('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE1' }] })
        .reply(200, {})

      const rAdd = await testDestination.testAction('syncList', {
        event: retlRowEvent('new', addEmail),
        settings,
        mapping: { list_id: listId, email: addEmail, __segment_internal_sync_mode: 'mirror' }
      })
      expect(rAdd[0].status).toBe(200)

      nock(`${API_URL}/profiles`)
        .get(`/?filter=any(email,["${removeEmail}"])`)
        .reply(200, { data: [{ id: 'PROFILE2' }] })
      nock(`${API_URL}/lists/${listId}`)
        .delete('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE2' }] })
        .reply(200, {})

      const rRemove = await testDestination.testAction('syncList', {
        event: retlRowEvent('deleted', removeEmail),
        settings,
        mapping: { list_id: listId, email: removeEmail, __segment_internal_sync_mode: 'mirror' }
      })
      expect(rRemove[0].status).toBe(200)
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
        mapping: { list_id: listId, email: 'no-sync-mode@example.com' }
      })
    ).rejects.toThrow('Audience Membership must be a boolean')
  })

  it('throws the expanded no-list-id error for a genuine RETL event with no hook and no manual list_id', async () => {
    await expect(
      testDestination.testAction('syncList', {
        event: retlRowEvent('new', 'no-list-retl@example.com'),
        settings,
        mapping: { email: 'no-list-retl@example.com', __segment_internal_sync_mode: 'upsert' }
      })
    ).rejects.toThrow(NO_LIST_ID_ERROR)
  })
})
