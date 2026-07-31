import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)

describe('Webhook.bugBash', () => {
  it('is a no-op and completes without making a request', async () => {
    const event = createTestEvent({ event: 'Test Event' })

    const responses = await testDestination.testAction('bugBash', {
      event,
      mapping: {},
      settings: { requiredAuthField: 'x' }
    })

    expect(responses).toHaveLength(0)
  })
})
