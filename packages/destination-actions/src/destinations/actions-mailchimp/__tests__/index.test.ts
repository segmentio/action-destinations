import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

describe('actions-mailchimp', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('testAuthentication', () => {
    it('validates the API key against the resolved datacenter root', async () => {
      nock('https://us6.api.mailchimp.com/3.0').get('/').reply(200, {})

      const settings = { apiKey: 'test-api-key-us6', audienceId: 'list123' }
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrow()
    })

    it('honors an explicit datacenter override', async () => {
      nock('https://us1.api.mailchimp.com/3.0').get('/').reply(200, {})

      const settings = { apiKey: 'test-api-key-us6', dataCenter: 'us1', audienceId: 'list123' }
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrow()
    })

    it('throws when authentication fails', async () => {
      nock('https://us6.api.mailchimp.com/3.0').get('/').reply(401, { title: 'API Key Invalid' })

      const settings = { apiKey: 'test-api-key-us6', audienceId: 'list123' }
      await expect(testDestination.testAuthentication(settings)).rejects.toThrow()
    })
  })
})
