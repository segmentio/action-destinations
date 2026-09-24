import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Destination)

const settings = { api_key: 'fake-api-key' }

const HOOK_LIST_ID = 'HOOK-LIST-ID'
const HOOK_LIST_NAME = 'Hook-Created List'

// A genuine RETL row event (syncMode-driven, no context.personas at all) - the only way to get
// a list id here is via the retlOnMappingSave hook's saved output (functions.ts:
// `hookOutputs?.id ?? payload.list_id`).
function retlRowEvent(event: 'new' | 'deleted', email: string) {
  return createTestEvent({ event, type: 'track', properties: { email } })
}

const hookMapping = {
  __segment_internal_sync_mode: 'mirror',
  retlOnMappingSave: {
    outputs: { id: HOOK_LIST_ID, name: HOOK_LIST_NAME }
  }
}

describe('Klaviyo.syncList - retlOnMappingSave hook output as list id', () => {
  beforeEach(() => nock.cleanAll())

  it('uses the saved hook list id for the add branch', async () => {
    const email = 'add-user@example.com'
    nock(API_URL)
      .post('/profiles/', { data: { type: 'profile', attributes: { email } } })
      .reply(200, { data: { id: 'PROFILE1' } })

    const scope = nock(`${API_URL}/lists/${HOOK_LIST_ID}`)
      .post('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE1' }] })
      .reply(200, {})

    const r = await testDestination.testAction('syncList', {
      event: retlRowEvent('new', email),
      settings,
      mapping: { ...hookMapping, email }
    })

    expect(r[0].status).toBe(200)
    expect(scope.isDone()).toBe(true)
  })

  it('uses the saved hook list id for the remove branch too', async () => {
    const email = 'remove-user@example.com'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["${email}"])`)
      .reply(200, { data: [{ id: 'PROFILE2' }] })

    const scope = nock(`${API_URL}/lists/${HOOK_LIST_ID}`)
      .delete('/relationships/profiles/', { data: [{ type: 'profile', id: 'PROFILE2' }] })
      .reply(200, {})

    const r = await testDestination.testAction('syncList', {
      event: retlRowEvent('deleted', email),
      settings,
      mapping: { ...hookMapping, email }
    })

    expect(r[0].status).toBe(200)
    expect(scope.isDone()).toBe(true)
  })
})
