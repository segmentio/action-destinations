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
})
