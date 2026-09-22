import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_VERSION, BASE_URL } from '../../constants'

// The upsert/mirror/delete/legacy test files exercise the `sync` action's perform/performBatch
// path with a pre-resolved `mapping.retlOnMappingSave.outputs`, and functions.test.ts unit-tests
// `getAudienceId`'s hookOutputs-resolution logic in isolation. Neither invokes the
// `retlOnMappingSave` hook itself. This file calls it end-to-end via executeHook(), covering the
// main create/select-existing-audience paths implemented in `hook-functions.ts`'s `performHook`.

const testDestination = createTestIntegration(Destination)

const AD_ACCOUNT_ID = '1500000000000000'
const AUDIENCE_ID = '900'

const settings = {
  retlAdAccountId: AD_ACCOUNT_ID
}

describe('FacebookCustomAudiences.sync - retlOnMappingSave hook (executeHook end-to-end)', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('creates a new audience when operation is "create"', async () => {
    nock(`${BASE_URL}/${API_VERSION}/act_${AD_ACCOUNT_ID}`)
      .post('/customaudiences', {
        name: 'test-audience',
        subtype: 'CUSTOM',
        customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
      })
      .reply(200, { id: AUDIENCE_ID })

    const response = await testDestination.actions.sync.executeHook('retlOnMappingSave', {
      settings,
      hookInputs: { operation: 'create', audienceName: 'test-audience' },
      payload: {}
    })

    expect(response).toMatchObject({
      successMessage: `Audience created with ID: ${AUDIENCE_ID}`,
      savedData: {
        audienceId: AUDIENCE_ID,
        audienceName: 'test-audience'
      }
    })
  })

  it('connects to an existing audience when operation is "existing"', async () => {
    nock(`${BASE_URL}/${API_VERSION}`)
      .get(`/${AUDIENCE_ID}`)
      .query({ fields: 'id,name' })
      .reply(200, { id: AUDIENCE_ID, name: 'Existing Audience' })

    const response = await testDestination.actions.sync.executeHook('retlOnMappingSave', {
      settings,
      hookInputs: { operation: 'existing', existingAudienceId: AUDIENCE_ID },
      payload: {}
    })

    expect(response).toMatchObject({
      successMessage: `Connected to audience with ID: ${AUDIENCE_ID}`,
      savedData: {
        audienceId: AUDIENCE_ID,
        audienceName: 'Existing Audience'
      }
    })
  })

  it('returns an error object (not a thrown exception) when a required hook input is missing', async () => {
    // operation: 'create' but no audienceName provided.
    const response = await testDestination.actions.sync.executeHook('retlOnMappingSave', {
      settings,
      hookInputs: { operation: 'create' },
      payload: {}
    })

    expect(response).toMatchObject({
      error: {
        message: 'Missing audience name value'
      }
    })
  })
})
