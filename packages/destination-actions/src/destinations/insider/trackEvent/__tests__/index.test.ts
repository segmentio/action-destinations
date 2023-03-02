import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Insider.trackEvent', () => {
  it('should update user event with default mapping', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      event: 'Track'
    })

    const responses = await testDestination.testAction('trackEvent', { event })
    expect(responses[0].status).toBe(200)
  })
})
