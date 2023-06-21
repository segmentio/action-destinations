import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Devrev.createRevUser', () => {
  it('makes the correct API call to create a user and creates the right body', async () => {
    nock('https://api.devrev.ai').get('/tags.list').reply(200, {})
    nock('https://api.devrev.ai').get('/internal/accounts.list*').reply(200, {})
    nock('https://api.devrev.ai').get('/internal/rev-orgs.list*').reply(200, {})
    nock('https://api.devrev.ai').get('/internal/rev-users.list*').reply(200, {})
    nock('https://api.devrev.ai').post('/internal/accounts.create').reply(200, {})
    nock('https://api.devrev.ai').post('/internal/rev-users.create').reply(200, {})
    nock('https://api.devrev.ai').post('/timeline-entries.create').reply(200, {})

    const eventName = 'test-event'
    const properties = {
      partId: 'test',
      title: 'test',
      description: 'test',
      email: 'test@tester.org'
    }
    const userId = 'test-user'
    const timestamp = '2023-06-21T20:29:45.548Z'
    const event = createTestEvent({
      type: 'track',
      userId,
      event: eventName,
      timestamp,
      properties
    })
    console.log(event)
    const settings = {
      apiKey: 'blank',
      devrevApiEndpoint: 'https://api.devrev.ai'
    }
    const mapping = {
      email: 'test@tester.org',
      fullName: 'test',
      comment: 'test'
    }
    const response = await testDestination.testAction('createRevUser', { settings, mapping, event })
    console.log(response)
    expect(response).toBeTruthy()
  })
})
