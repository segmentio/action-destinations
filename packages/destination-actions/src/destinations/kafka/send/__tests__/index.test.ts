import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Kafka.send', () => {
  it.skip('works with default mappings', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      properties: {
        email: 'test@iterable.com'
      }
    })

    const responses = await testDestination.testAction('send', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
  })
})
