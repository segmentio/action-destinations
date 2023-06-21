import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Devrev.createRevUser', () => {
  it('makes the correct API call to create a user', async () => {
    nock('https://api.devrev.ai').post('/work.create').reply(200, {})
    const eventName = 'test-event'
    const properties = {
      partId: 'test',
      title: 'test',
      description: 'test',
      email: 'test@tester.org'
    }
    const userId = 'test-user'
    const timestamp = new Date().toISOString()
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
      partId: 'test',
      title: 'test',
      description: 'test'
    }
    const response = await testDestination.testAction('createWork', { settings })
    console.log(response)
    expect(response).toBeTruthy()
  })
})
