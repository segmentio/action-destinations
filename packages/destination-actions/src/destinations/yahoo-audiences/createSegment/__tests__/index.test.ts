import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../constants'

const testDestination = createTestIntegration(Destination)

describe('YahooAudiences.createSegment', () => {
  // This is a dummy test
  it('should pull yahoo taxonomy', async () => {
    const event = createTestEvent()
    nock(`${BASE_URL}/v1/taxonomy`)
      .post(event as any)
      .reply(200)
    const responses = await testDestination.testAction('send', {
      event,
      mapping: {},
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
