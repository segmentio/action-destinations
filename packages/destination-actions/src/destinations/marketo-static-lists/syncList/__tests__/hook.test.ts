import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BULK_IMPORT_ENDPOINT, GET_LEADS_ENDPOINT, REMOVE_USERS_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const API_ENDPOINT = 'https://123-ABC-456.mktorest.com'
const settings = {
  client_id: '1234',
  client_secret: '1234',
  api_endpoint: API_ENDPOINT,
  folder_name: 'Test Folder'
}

const HOOK_LIST_ID = '999'
const HOOK_LIST_NAME = 'Hook-Created List'

// No context.personas.external_audience_id at all - a realistic RETL event, where the only way
// to get a list id is via the retlOnMappingSave hook's saved output (functions.ts:
// `hookOutputs?.id ?? payload.external_id`, now also applied to removeFromList/removeFromListBatch).
function retlEventWithoutExternalId(email: string, membership: boolean) {
  return createTestEvent({
    event: 'Test Event',
    type: 'track',
    properties: { my_audience: membership, email },
    context: {
      traits: { email },
      personas: {
        computation_class: 'audience',
        computation_key: 'my_audience'
      }
    }
  })
}

const mapping = {
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
  event_name: { '@path': '$.event' },
  retlOnMappingSave: {
    outputs: {
      id: HOOK_LIST_ID,
      name: HOOK_LIST_NAME
    }
  }
}

describe('MarketoStaticLists.syncList - retlOnMappingSave hook output as list id', () => {
  beforeEach(() => nock.cleanAll())

  it('uses the saved hook list id for the add branch', async () => {
    const scope = nock(API_ENDPOINT)
      .post(BULK_IMPORT_ENDPOINT.replace('externalId', HOOK_LIST_ID).replace('fieldToLookup', 'email'))
      .reply(200, { success: true })

    const r = await testDestination.testAction('syncList', {
      event: retlEventWithoutExternalId('add-user@example.com', true),
      settings,
      mapping
    })

    expect(r[0].status).toEqual(200)
    expect(scope.isDone()).toBe(true)
  })

  it('uses the saved hook list id for the remove branch too', async () => {
    const getLeadsScope = nock(API_ENDPOINT)
      .get(
        GET_LEADS_ENDPOINT.replace('field', 'email').replace(
          'emailsToFilter',
          encodeURIComponent('remove-user@example.com')
        )
      )
      .reply(200, { success: true, result: [{ id: 55 }] })

    const deleteLeadsScope = nock(API_ENDPOINT)
      .delete(REMOVE_USERS_ENDPOINT.replace('listId', HOOK_LIST_ID).replace('idsToDelete', '55'))
      .reply(200, { success: true })

    const r = await testDestination.testAction('syncList', {
      event: retlEventWithoutExternalId('remove-user@example.com', false),
      settings,
      mapping
    })

    expect(r[0].status).toEqual(200)
    expect(r[1].status).toEqual(200)
    expect(getLeadsScope.isDone()).toBe(true)
    expect(deleteLeadsScope.isDone()).toBe(true)
  })
})
