/**
 * Destination-level tests for Collab Travel CRM
 * 
 * Tests authentication and request configuration
 */

import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

describe('Collab Travel CRM', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('testAuthentication', () => {
    it('should validate authentication with valid API key', async () => {
      nock(COLLAB_CRM_BASE_URL)
        .post('/segment-destination')
        .matchHeader('Authorization', 'Bearer valid-api-key')
        .reply(200, { success: true })

      await expect(
        testDestination.testAuthentication({ apiKey: 'valid-api-key' })
      ).resolves.not.toThrow()
    })

    it('should fail authentication with invalid API key', async () => {
      nock(COLLAB_CRM_BASE_URL)
        .post('/segment-destination')
        .matchHeader('Authorization', 'Bearer invalid-api-key')
        .reply(401, { error: 'Unauthorized' })

      await expect(
        testDestination.testAuthentication({ apiKey: 'invalid-api-key' })
      ).rejects.toThrow()
    })

    it('should fail authentication when API key is missing', async () => {
      await expect(
        testDestination.testAuthentication({ apiKey: '' })
      ).rejects.toThrow()
    })
  })

  describe('extendRequest', () => {
    it('should add Authorization header with API key', () => {
      const settings = { apiKey: 'test-api-key' }
      const requestConfig = Definition.extendRequest?.({ settings } as any)

      expect(requestConfig?.headers).toEqual({
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      })
    })
  })

  describe('presets', () => {
    it('should have trackEvent preset for track calls', () => {
      const trackPreset = Definition.presets?.find(p => p.name === 'Track Events')
      
      expect(trackPreset).toBeDefined()
      expect(trackPreset?.subscribe).toBe('type = "track"')
      expect(trackPreset?.partnerAction).toBe('trackEvent')
    })

    it('should have identifyUser preset for identify calls', () => {
      const identifyPreset = Definition.presets?.find(p => p.name === 'Identify Users')
      
      expect(identifyPreset).toBeDefined()
      expect(identifyPreset?.subscribe).toBe('type = "identify"')
      expect(identifyPreset?.partnerAction).toBe('identifyUser')
    })
  })
})
