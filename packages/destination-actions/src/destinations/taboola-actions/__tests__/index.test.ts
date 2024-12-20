import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const accountId = 'TestAccount'
const audienceId = '1111'
const createAudienceUrl = `https://backstage.taboola.com/backstage/api/1.0/${accountId}`

const getAudienceInput = {
  externalId: audienceId,
  settings: {
    client_id: 'test_client_id',
    client_secret: 'test_client'
  },
  audienceSettings: {}
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

      const createAudienceInput1 = {
        settings: {
          client_id: 'test_client_id',
          client_secret: 'test_client'
        },
        audienceName: '',
        audienceSettings: {
          ttl_in_hours: 1024,
          exclude_from_campaigns: false,
          account_id:accountId
        }
      }

      await expect(testDestination.createAudience(createAudienceInput1)).rejects.toThrowError(
        new IntegrationError("Missing 'Audience Name' value", 'MISSING_REQUIRED_FIELD', 400)
      )
    })

    it('should fail if no account ID is set', async () => {

      const createAudienceInput2 = {
        settings: {
          client_id: 'test_client_id',
          client_secret: 'test_client'
        },
        audienceName: 'Test Audience',
        audienceSettings: {
          ttl_in_hours: 1024,
          exclude_from_campaigns: false,
          account_id:''
        }
      }

      await expect(testDestination.createAudience(createAudienceInput2)).rejects.toThrowError(
        new IntegrationError("Missing 'Account ID' value", 'MISSING_REQUIRED_FIELD', 400)
      )
    })

    it('should create a new Taboola Audience', async () => {
      nock('https://backstage.taboola.com').post('/backstage/oauth/token').reply(200, { accessToken: 'some_token' })
      nock(createAudienceUrl).post('/audience_onboarding/create').reply(200, { audience_id: '1234' })

      const createAudienceInput3 = {
        settings: {
          client_id: 'test_client_id',
          client_secret: 'test_client'
        },
        audienceName: 'Test Audience',
        audienceSettings: {
          ttl_in_hours: 1024,
          exclude_from_campaigns: false,
          account_id:accountId
        }
      }
      const r = await testDestination.createAudience(createAudienceInput3)
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
