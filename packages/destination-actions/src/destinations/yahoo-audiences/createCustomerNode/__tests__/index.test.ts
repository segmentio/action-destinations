import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('YahooAudiences.createCustomerNode', () => {
  it.skip('should pull yahoo taxonomy', async () => {
    const event = createTestEvent()
    nock(`https://datax.yahooapis.com/v1/taxonomy/append`)
      .post(event as any)
      .reply(200)

    const responses = await testDestination.testAction('createCustomerNode', {
      event,
      mapping: {},
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
