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

interface Segment {
  id: string
  name: string
  type?: string
}

interface SegmentResponse {
  segments?: Segment[]
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

        if (!data.campaigns || !Array.isArray(data.campaigns) || data.campaigns.length === 0) {
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
  },

  segment_id: async (request: RequestClient, { settings }: { settings: Settings }): Promise<DynamicFieldResponse> => {
    try {
      const allSegments: Segment[] = []
      let page = 0
      // Keep fetching segments until we get an empty array
      //eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await request(`${settings.endpoint}/segments/list`, {
          method: 'GET',
          skipResponseCloning: true,
          searchParams: {
            page: page.toString()
          }
        })

        const data = response.data as SegmentResponse

        if (!data.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
          break
        }

        // Add segments from current page to our collection
        allSegments.push(...data.segments)

        // Move to next page
        page++
      }

      if (allSegments.length === 0) {
        return {
          choices: [],
          error: {
            message: 'No segments found in your Braze account',
            code: '404'
          }
        }
      }

      // Display all segments
      const segments = allSegments.map((segment) => ({
        label: segment.name,
        value: segment.id
      }))

      return {
        choices: segments
      }
    } catch (error: any) {
      return {
        choices: [],
        error: {
          message: error.message || 'Failed to fetch segments from Braze API',
          code: error.status || '500'
        }
      }
    }
  }
}
