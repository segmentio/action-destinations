import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Devrev.createWork', () => {
  it('makes the correct API call to create a work', async () => {
    nock('https://api.devrev.ai').post('/work.create').reply(200, {})
    const eventName = 'test-event'
    const properties = {}
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
