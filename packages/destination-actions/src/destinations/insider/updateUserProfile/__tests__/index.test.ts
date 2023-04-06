import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Insider.updateUserProfile', () => {
  it('should update user profile with default mapping', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      event: 'Identify'
    })

    const responses = await testDestination.testAction('updateUserProfile', { event })
    expect(responses[0].status).toBe(200)
  })
})
