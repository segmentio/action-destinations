import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL } from '../constants'

const testDestination = createTestIntegration(Definition)

describe('Vibe Audience', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).get(`/v1/webhooks/twilio/test-advertiser-id`).reply(200, { success: true })

      // This should match your authentication.fields
      const authData = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    it('should create a new audience', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/v1/webhooks/twilio/test-advertiser-id/audience`).reply(200, {
        advertiser_id: 'test-advertiser-id',
        custom_attributes: '',
        id: 'test-audience-id',
        id_in_integration: 'test-integration-id',
        integration_type: 'HubSpot',
        name: 'Test Audience',
        segment_info: null,
        tenant_id: 'test-tenant-id'
      })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const createAudienceInput = {
        audienceName: 'Test Audience',
        settings
      }

      const result = await testDestination.createAudience(createAudienceInput)

      expect(result).toEqual({
        externalId: 'test-audience-id'
      })
    })
  })

  describe('getAudience', () => {
    it('should get an existing audience', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).get(`/v1/webhooks/twilio/test-advertiser-id/audiences/test-audience-id`).reply(200, {
        advertiser_id: 'test-advertiser-id',
        custom_attributes: '',
        id: 'test-audience-id',
        id_in_integration: 'test-integration-id',
        integration_type: 'HubSpot',
        name: 'Test Audience',
        segment_info: null,
        tenant_id: 'test-tenant-id'
      })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const getAudienceInput = {
        externalId: 'test-audience-id',
        settings
      }

      const result = await testDestination.getAudience(getAudienceInput)

      expect(result).toEqual({
        externalId: 'test-audience-id'
      })
    })
  })
})
