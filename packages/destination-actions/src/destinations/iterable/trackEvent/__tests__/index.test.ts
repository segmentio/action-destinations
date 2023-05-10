import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iterable.trackEvent', () => {
  it('works with default mappings', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      properties: {
        email: 'test@iterable.com'
      }
    })

    nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
  })

  it('throws an error if `email` or `userId` are not defined', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: null
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(PayloadValidationError)
  })
})
