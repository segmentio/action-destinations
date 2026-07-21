import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)

describe('Braze triggerCampaign dynamic field functions', () => {
  const settings = {
    app_id: 'test-app-id',
    api_key: 'test-api-key',
    endpoint: 'https://rest.iad-01.braze.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  describe('campaign_id', () => {
    it('should return campaigns as choices', async () => {
      const mockCampaigns = [
        { id: 'campaign-1', name: 'Test Campaign 1', tags: ['tag1'] },
        { id: 'campaign-2', name: 'Test Campaign 2', tags: ['tag2'] }
      ]

      // Mock the first page of campaigns
      nock('https://rest.iad-01.braze.com')
        .get('/campaigns/list')
        .query({ page: '0' })
        .reply(200, { campaigns: mockCampaigns })

      // Mock the second page (empty) to end pagination
      nock('https://rest.iad-01.braze.com').get('/campaigns/list').query({ page: '1' }).reply(200, { campaigns: [] })

      const result = await testDestination.testDynamicField('triggerCampaign', 'campaign_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [
          { label: 'Test Campaign 1', value: 'campaign-1' },
          { label: 'Test Campaign 2', value: 'campaign-2' }
        ]
      })
    })

    it('should handle empty campaigns list', async () => {
      // Mock empty campaigns response
      nock('https://rest.iad-01.braze.com').get('/campaigns/list').query({ page: '0' }).reply(200, { campaigns: [] })

      const result = await testDestination.testDynamicField('triggerCampaign', 'campaign_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [],
        error: {
          message: 'No campaigns found in your Braze account',
          code: '404'
        }
      })
    })

    it('should handle API error', async () => {
      // Mock API error
      nock('https://rest.iad-01.braze.com')
        .get('/campaigns/list')
        .query({ page: '0' })
        .reply(500, { message: 'Internal Server Error' })

      const result = await testDestination.testDynamicField('triggerCampaign', 'campaign_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [],
        error: {
          message: 'Internal Server Error',
          code: '500'
        }
      })
    })

    it('should handle multiple pages of campaigns', async () => {
      const mockCampaignsPage1 = [
        { id: 'campaign-1', name: 'Test Campaign 1', tags: ['tag1'] },
        { id: 'campaign-2', name: 'Test Campaign 2', tags: ['tag2'] }
      ]

      const mockCampaignsPage2 = [
        { id: 'campaign-3', name: 'Test Campaign 3', tags: ['tag3'] },
        { id: 'campaign-4', name: 'Test Campaign 4', tags: ['tag4'] }
      ]

      // Mock the first page of campaigns
      nock('https://rest.iad-01.braze.com')
        .get('/campaigns/list')
        .query({ page: '0' })
        .reply(200, { campaigns: mockCampaignsPage1 })

      // Mock the second page
      nock('https://rest.iad-01.braze.com')
        .get('/campaigns/list')
        .query({ page: '1' })
        .reply(200, { campaigns: mockCampaignsPage2 })

      // Mock the third page (empty) to end pagination
      nock('https://rest.iad-01.braze.com').get('/campaigns/list').query({ page: '2' }).reply(200, { campaigns: [] })

      const result = await testDestination.testDynamicField('triggerCampaign', 'campaign_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [
          { label: 'Test Campaign 1', value: 'campaign-1' },
          { label: 'Test Campaign 2', value: 'campaign-2' },
          { label: 'Test Campaign 3', value: 'campaign-3' },
          { label: 'Test Campaign 4', value: 'campaign-4' }
        ]
      })
    })

    it('should handle malformed response', async () => {
      // Mock malformed response without campaigns array
      nock('https://rest.iad-01.braze.com')
        .get('/campaigns/list')
        .query({ page: '0' })
        .reply(200, { message: 'Success but no campaigns field' })

      const result = await testDestination.testDynamicField('triggerCampaign', 'campaign_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [],
        error: {
          message: 'No campaigns found in your Braze account',
          code: '404'
        }
      })
    })
  })
})
