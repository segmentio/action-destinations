import type { DynamicFieldResponse, ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import { APIError } from '@segment/actions-core'

interface Canvas {
  id: string
  name: string
}

interface ListItemResponse {
  label: string
  value: string
}

interface BrazeCanvasResponse {
  canvases: Canvas[]
  message: string
}

export const dynamicFields = {
  canvas_id: async (request: RequestClient, { settings }: { settings: Settings }): Promise<DynamicFieldResponse> => {
    const canvasListItems: ListItemResponse[] = []

    if (!settings.endpoint) {
      throw new APIError('Braze REST API endpoint is required.', 400)
    }

    try {
      // Initialize variables for pagination
      let page = 0
      let hasMore = true

      // Fetch all canvases with pagination
      while (hasMore) {
        const response: ModifiedResponse<BrazeCanvasResponse> = await request(`${settings.endpoint}/canvas/list`, {
          method: 'GET',
          searchParams: {
            page: page
          }
        })

        const canvases = response?.data?.canvases || []

        // If we got less canvases than expected or none, we've reached the end
        if (canvases.length === 0) {
          hasMore = false
        } else {
          // Process this page of canvases
          canvases.forEach((canvas: Canvas) => {
            canvasListItems.push({
              label: `${canvas.name}`,
              value: canvas.id
            })
          })

          // Move to next page
          page++
        }
      }

      // Sort by name for readability after all pages are fetched
      canvasListItems.sort((a: ListItemResponse, b: ListItemResponse) => a.label.localeCompare(b.label))
    } catch (error) {
      throw new APIError(`Failed to fetch canvas list: ${error instanceof Error ? error.message : String(error)}`, 400)
    }

    return {
      choices: canvasListItems
    }
  }
}
