import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BULK_IMPORT_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const EXTERNAL_AUDIENCE_ID = '12345'
const API_ENDPOINT = 'https://123-ABC-456.mktorest.com'
const settings = {
  client_id: '1234',
  client_secret: '1234',
  api_endpoint: API_ENDPOINT,
  folder_name: 'Test Folder'
}

const event = createTestEvent({
  event: 'Audience Entered',
  type: 'track',
  properties: {},
  context: {
    traits: {
      email: 'testing@testing.com'
    },
    personas: {
      external_audience_id: EXTERNAL_AUDIENCE_ID
    }
  }
})

const audienceName = 'The Best Test Audience'
const listID = '1'

const hookInputNew = {
  settings: settings,
  hookInputs: {
    list_name: audienceName
  },
  payload: {}
}

const hookInputExisting = {
  settings: settings,
  hookInputs: {
    list_id: listID
  },
  payload: {}
}

describe('MarketoStaticLists.addToList', () => {
  it('should succeed if response from Marketo is successful', async () => {
    const bulkImport = API_ENDPOINT + BULK_IMPORT_ENDPOINT.replace('externalId', EXTERNAL_AUDIENCE_ID)
    nock(bulkImport).post(/.*/).reply(200, { success: true })

    const r = await testDestination.testAction('addToList', {
      event,
      settings: settings,
      useDefaultMappings: true
    })

    expect(r[0].status).toEqual(200)
    expect(r[0].options.body).toMatchInlineSnapshot(`
      "----SEGMENT-DATA--
      Content-Disposition: form-data; name=\\"file\\"; filename=\\"leads.csv\\"
      Content-Type: text/csv

      email
      testing@testing.com
      ----SEGMENT-DATA----
      "
    `)
  })

  it('should fail if Marketo returns error', async () => {
    const bulkImport = API_ENDPOINT + BULK_IMPORT_ENDPOINT.replace('externalId', 'invalidID')
    nock(bulkImport)
      .post(/.*/)
      .reply(200, { success: false, errors: [{ code: 1013, message: 'Static list not found' }] })

    await expect(
      testDestination.testAction('addToList', {
        event,
        settings: settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Static list not found')
  })

  it('create a new list with hook', async () => {
    nock(
      `${API_ENDPOINT}/identity/oauth/token?grant_type=client_credentials&client_id=${settings.client_id}&client_secret=${settings.client_secret}`
    )
      .post(/.*/)
      .reply(200, {
        access_token: 'access_token'
      })

    nock(`${API_ENDPOINT}/rest/asset/v1/folder/byName.json?name=${encodeURIComponent(settings.folder_name)}`)
      .get(/.*/)
      .reply(200, {
        success: true,
        result: [
          {
            name: settings.folder_name,
            id: listID
          }
        ]
      })

    nock(`${API_ENDPOINT}/rest/asset/v1/staticLists.json?folder=12&name=${encodeURIComponent(audienceName)}`)
      .post(/.*/)
      .reply(200, {
        success: true,
        result: [
          {
            name: audienceName,
            id: listID
          }
        ]
      })

    const r = await testDestination.actions.addToList.executeHook('retlOnMappingSave', hookInputNew)

    expect(r.savedData).toMatchObject({
      id: listID,
      name: audienceName
    })
    expect(r.successMessage).toMatchInlineSnapshot(`"List '${audienceName}' (id: ${listID}) created successfully!"`)
  })

  it('verify the existing list', async () => {
    nock(
      `${API_ENDPOINT}/identity/oauth/token?grant_type=client_credentials&client_id=${settings.client_id}&client_secret=${settings.client_secret}`
    )
      .post(/.*/)
      .reply(200, {
        access_token: 'access_token'
      })
    nock(`${API_ENDPOINT}/rest/asset/v1/staticList/${listID}.json`)
      .get(/.*/)
      .reply(200, {
        success: true,
        result: [
          {
            name: audienceName,
            id: listID
          }
        ]
      })

    const r = await testDestination.actions.addToList.executeHook('retlOnMappingSave', hookInputExisting)

    expect(r.savedData).toMatchObject({
      id: listID,
      name: audienceName
    })
    expect(r.successMessage).toMatchInlineSnapshot(`"Using existing list '${audienceName}' (id: ${listID})"`)
  })

  it('fail if list id does not exist', async () => {
    nock(
      `${API_ENDPOINT}/identity/oauth/token?grant_type=client_credentials&client_id=${settings.client_id}&client_secret=${settings.client_secret}`
    )
      .post(/.*/)
      .reply(200, {
        access_token: 'access_token'
      })
    nock(`${API_ENDPOINT}/rest/asset/v1/staticList/782.json`)
      .get(/.*/)
      .reply(200, {
        success: false,
        errors: [{ code: 1013, message: 'Static list not found' }]
      })

    await expect(testDestination.actions.addToList.executeHook('retlOnMappingSave', hookInputExisting)).rejects.toThrow(
      'Static list not found'
    )
  })

  describe('Journeys "Journeys Step Entered" preset', () => {
    // ../../index.ts declares a `specificEvent` preset (eventSlug: 'journeys_step_entered_track')
    // that routes to addToList using `defaultValues(addToList.fields)` as its mapping. addToList
    // doesn't read computation_class/audienceMembership at all - add vs. remove is decided purely
    // by which action the preset routes to (addToList here, removeFromList for the "exited"
    // presets). So this test only needs to prove that the preset's default mapping correctly
    // extracts the external_audience_id and lead data from a realistic Journeys step event.
    it('uses the preset default mapping to add a Journeys user to a Marketo static list', async () => {
      const preset = Destination.presets?.find(
        (p) =>
          p.partnerAction === 'addToList' && p.type === 'specificEvent' && p.eventSlug === 'journeys_step_entered_track'
      )
      if (!preset) {
        throw new Error('Expected to find a "Journeys Step Entered" preset routing to addToList')
      }

      const JOURNEYS_EXTERNAL_AUDIENCE_ID = '98765'
      const journeysEvent = createTestEvent({
        event: 'Journeys Step Entered',
        type: 'track',
        properties: {},
        context: {
          traits: {
            email: 'journeys-user@testing.com'
          },
          personas: {
            computation_class: 'journey_step',
            computation_key: 'personas_test_audience',
            external_audience_id: JOURNEYS_EXTERNAL_AUDIENCE_ID
          }
        }
      })

      const bulkImport = API_ENDPOINT + BULK_IMPORT_ENDPOINT.replace('externalId', JOURNEYS_EXTERNAL_AUDIENCE_ID)
      nock(bulkImport).post(/.*/).reply(200, { success: true })

      const r = await testDestination.testAction(preset.partnerAction, {
        event: journeysEvent,
        settings,
        mapping: preset.mapping,
        useDefaultMappings: false
      })

      // Use the LAST response, not r[0]: createTestIntegration's testAction() only resets its
      // internal responses array after a successful call, so when the immediately preceding
      // test in this file throws (see "fail if list id does not exist" above), that array isn't
      // cleared and this call's response gets appended after a stale leftover entry. r[0] would
      // then be that stale entry rather than this call's own result. This is a pre-existing
      // quirk in createTestIntegration, not something introduced by this test.
      const response = r[r.length - 1]

      expect(response.status).toEqual(200)
      expect(response.options.body).toMatchInlineSnapshot(`
        "----SEGMENT-DATA--
        Content-Disposition: form-data; name=\\"file\\"; filename=\\"leads.csv\\"
        Content-Type: text/csv

        email
        journeys-user@testing.com
        ----SEGMENT-DATA----
        "
      `)
    })
  })

  describe('RETL perform() path with saved hook outputs', () => {
    // The tests above call the retlOnMappingSave hook directly via executeHook(). This test instead
    // goes through perform() itself (testAction), with a realistic RETL event/mapping that carries
    // `__segment_internal_sync_mode` (present on real RETL syncs, even though addToList doesn't
    // declare a top-level `syncMode` and therefore never reads it) and a `retlOnMappingSave.outputs`
    // mapping key simulating a list previously created/selected via the hook. It asserts that
    // addToList() prefers the saved hook output list ID over context.personas.external_audience_id
    // (see functions.ts: `hookOutputs?.id ?? payload.external_id`).
    it('uses the saved hookOutputs list ID rather than context.personas.external_audience_id', async () => {
      const hookListId = '999'
      const hookListName = 'Hook-Created List'

      const retlEvent = createTestEvent({
        event: 'Audience Entered',
        type: 'track',
        properties: {},
        context: {
          traits: {
            email: 'retl-user@testing.com'
          },
          personas: {
            // A realistic RETL event still carries this, but the saved hook output below must win.
            external_audience_id: EXTERNAL_AUDIENCE_ID
          }
        }
      })

      const bulkImport = API_ENDPOINT + BULK_IMPORT_ENDPOINT.replace('externalId', hookListId)
      nock(bulkImport).post(/.*/).reply(200, { success: true })

      const r = await testDestination.testAction('addToList', {
        event: retlEvent,
        settings,
        useDefaultMappings: true,
        mapping: {
          __segment_internal_sync_mode: 'add',
          retlOnMappingSave: {
            outputs: {
              id: hookListId,
              name: hookListName
            }
          }
        }
      })

      // Use the LAST response - see the comment on the "uses the preset default mapping..." test
      // above for why r[0] can be a stale entry from a preceding failing test in this file.
      const response = r[r.length - 1]

      expect(response.status).toEqual(200)
      expect(response.options.body).toMatchInlineSnapshot(`
        "----SEGMENT-DATA--
        Content-Disposition: form-data; name=\\"file\\"; filename=\\"leads.csv\\"
        Content-Type: text/csv

        email
        retl-user@testing.com
        ----SEGMENT-DATA----
        "
      `)
    })
  })
})
