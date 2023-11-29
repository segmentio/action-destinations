import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BULK_IMPORT_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const EXTERNAL_AUDIENCE_ID = '12345'
const API_ENDPOINT = 'https://marketo.com'
const settings = {
  client_id: '1234',
  client_secret: '1234',
  api_endpoint: 'https://marketo.com',
  folder_name: 'Test Audience'
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

      Email
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
})
