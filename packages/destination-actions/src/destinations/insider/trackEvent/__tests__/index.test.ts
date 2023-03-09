import nock from 'nock'

import Destination from '../../index'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'
const useDefaultMappings = true

describe('Insider.trackEvent', () => {
  it('should update user event with default mapping', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      timestamp,
      event: 'Test Event',
      anonymousId: 'test'
    })

    const responses = await testDestination.testAction('trackEvent', { event, useDefaultMappings })
    expect(responses[0].status).toBe(200)
  })
})
