import { RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../../generated-types'

interface Campaign {
  id: string
  name: string
  tags?: string[]
}

interface CampaignResponse {
  campaigns?: Campaign[]
  message?: string
}

export const dynamicFields = {
  campaign_id: async (request: RequestClient, { settings }: { settings: Settings }): Promise<DynamicFieldResponse> => {
    try {
      const allCampaigns: Campaign[] = []
      let page = 0
      // Keep fetching campaigns until we get an empty array
      //eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await request(`${settings.endpoint}/campaigns/list`, {
          method: 'GET',
          skipResponseCloning: true,
          searchParams: {
            page: page.toString()
          }
        })

        const data = response.data as CampaignResponse

        if (!data.campaigns || !Array.isArray(data.campaigns)) {
          break
        }

        // Add campaigns from current page to our collection
        if (data.campaigns) {
          allCampaigns.push(...data.campaigns)
        }

        // Move to next page
        page++
      }

      if (allCampaigns.length === 0) {
        return {
          choices: [],
          error: {
            message: 'No campaigns found in your Braze account',
            code: '404'
          }
        }
      }

      // Display all campaigns that can be triggered via the API
      const campaigns = allCampaigns.map((campaign) => ({
        label: campaign.name,
        value: campaign.id
      }))

      return {
        choices: campaigns
      }
    } catch (error: any) {
      return {
        choices: [],
        error: {
          message: error.message || 'Failed to fetch campaigns from Braze API',
          code: error.status || '500'
        }
      }
    }
  }
}
