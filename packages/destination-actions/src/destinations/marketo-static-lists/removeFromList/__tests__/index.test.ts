import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { GET_LEADS_ENDPOINT, REMOVE_USERS_ENDPOINT } from '../../constants'

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

describe('MarketoStaticLists.removeFromList', () => {
  it('should succeed if response from Marketo is successful', async () => {
    const getLeads =
      API_ENDPOINT + GET_LEADS_ENDPOINT.replace('emailsToFilter', encodeURIComponent('testing@testing.com'))
    nock(getLeads)
      .get(/.*/)
      .reply(200, { success: true, result: [{ id: 12 }] })

    const deleteLeads = API_ENDPOINT + REMOVE_USERS_ENDPOINT.replace('listId', '12345').replace('idsToDelete', '12')
    nock(deleteLeads).delete(/.*/).reply(200, { success: true })

    const r = await testDestination.testAction('removeFromList', {
      event,
      settings: settings,
      useDefaultMappings: true
    })

    expect(r[0].status).toEqual(200)
    expect(r[1].status).toEqual(200)
  })

  it('should fail if Marketo returns error for get leads', async () => {
    const getLeads =
      API_ENDPOINT + GET_LEADS_ENDPOINT.replace('emailsToFilter', encodeURIComponent('testing@testing.com'))
    nock(getLeads)
      .get(/.*/)
      .reply(200, { success: false, errors: [{ code: 1013, message: 'User not found' }] })

    await expect(
      testDestination.testAction('removeFromList', {
        event,
        settings: settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('User not found')
  })

  it('should fail if Marketo returns error for delete leads', async () => {
    const getLeads =
      API_ENDPOINT + GET_LEADS_ENDPOINT.replace('emailsToFilter', encodeURIComponent('testing@testing.com'))
    nock(getLeads)
      .get(/.*/)
      .reply(200, { success: true, result: [{ id: 12 }] })

    const deleteLeads = API_ENDPOINT + REMOVE_USERS_ENDPOINT.replace('listId', '12345').replace('idsToDelete', '12')
    nock(deleteLeads)
      .delete(/.*/)
      .reply(200, { success: false, errors: [{ code: 1013, message: 'User not in list' }] })

    await expect(
      testDestination.testAction('removeFromList', {
        event,
        settings: settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('User not in list')
  })
})
