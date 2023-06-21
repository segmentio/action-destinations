import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { testDevUserListResponse, testPartsResponse } from '../../mocks'

const testDestination = createTestIntegration(Destination)

describe('Devrev.createWork', () => {
  it('makes the correct API call to create a work', async () => {
    nock('https://api.devrev.ai')
      .post('/internal/works.create')
      .reply(201, (_, body) => body)
    nock('https://api.devrev.ai').get('/parts.list').reply(200, testPartsResponse)
    nock('https://api.devrev.ai').get('/dev-users.list').reply(200, testDevUserListResponse)

    const eventName = 'test-event'
    const properties = {}
    const userId = 'test-user'
    const timestamp = '2023-06-21T20:29:45.548Z'
    const partId = 'don:core:dvrv-us-1:devo/g0NHWj3i:product/2'
    const title = 'test-work'
    const description = 'test body'
    const assignTo = 'don:identity:dvrv-us-1:devo/g0NHWj3i:devu/1'
    const priority = 'p2'
    const type = 'issue'
    const event = createTestEvent({
      type: 'track',
      userId,
      event: eventName,
      timestamp,
      properties
    })
    const settings = {
      apiKey: 'blank',
      devrevApiEndpoint: 'https://api.devrev.ai'
    }
    const mapping = {
      partId,
      title,
      description,
      assignTo,
      priority,
      type
    }
    const response = await testDestination.testAction('createWork', {
      settings,
      useDefaultMappings: true,
      mapping,
      event
    })

    //Make sure the request body is correct, which is the payload that would be sent to the API
    expect(response).toBeTruthy()
    expect(response[0].data).toEqual({
      applies_to_part: partId,
      title,
      body: description,
      owned_by: [assignTo],
      type,
      priority
    })
  })
})
