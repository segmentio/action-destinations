import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AccoilAnalytics.postToAccoil', () => {
  // TODO: Test your action
  const event1 = createTestEvent()

  it('should validate api keys', async () => {
    nock('https://in.accoil.com')
      .post('/segment')
      .reply(400, { message: "API Key should start with 'Basic' and be followed by a space and your API key." })
    try {
      await testDestination.testAuthentication({ api_key: 'secret' })
    } catch (err: any) {
      console.log('THIS IS ERROR', err)
      expect(err.message).toContain('Credentials are invalid: 400 Bad Request')
    }
  })

  it('should send data upstream', async () => {
    nock('https://in.accoil.com').post('/segment').reply(202, {})

    const response = await testDestination.testAction('postToAccoil', {
      event: event1,
      useDefaultMappings: true
    })
    expect(response.length).toBe(1)
    expect(new URL(response[0].url).pathname).toBe('/segment')
    expect(response[0].status).toBe(202)
  })
})
