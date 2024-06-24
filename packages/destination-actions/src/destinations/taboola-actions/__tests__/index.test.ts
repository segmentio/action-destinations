import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const accountId = 'TestAccount'
const audienceId = '1111'
const createAudienceUrl = `https://backstage.taboola.com/backstage/api/1.0/${accountId}`

const createAudienceInput = {
  settings: {},
  audienceName: '',
  audienceSettings: {
    ttl_in_hours: 1024,
    exclude_from_campaigns: false
  }
}
const getAudienceInput = {
  externalId: audienceId,
  settings: {}
}

describe('Taboola (actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://backstage.taboola.com').get('/backstage/oauth/token').reply(200, {})
      const authData = {
        client_id: 'test_client_id',
        client_secret: 'test_client'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(
        new IntegrationError("Missing 'Audience Name' value", 'MISSING_REQUIRED_FIELD', 400)
      )
    })

    it('should fail if no account ID is set', async () => {
      createAudienceInput.audienceName = 'Test Audience'
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(
        new IntegrationError("Missing 'Account ID' value", 'MISSING_REQUIRED_FIELD', 400)
      )
    })

    it('should create a new Taboola Audience', async () => {
      nock(createAudienceUrl).post('/audience_onboarding/create').reply(200, { audience_id: '1234' })

      createAudienceInput.audienceName = 'Test Audience'
      createAudienceInput.audienceSettings.account_id = accountId

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({ externalId: '1234' })
    })
  })

  describe('getAudience', () => {
    it('should get the audience ID', async () => {
      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({ externalId: audienceId })
    })
  })
})
