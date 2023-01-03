import { ModifiedResponse, RequestClient, DynamicFieldResponse, DynamicFieldItem } from '@segment/actions-core'
import { PAGINATION_COUNT, SEGMENT_ENDPOINTS, DEFAULT_SEGMENT_ENDPOINT } from './properties'
import { SegmentPublicAPIError } from './errors'

interface SourceListItemMetadata {
  id: string
  slug: string
  name: string
  description: string
}

interface SourceListItem {
  id: string
  slug: string
  name: string
  workspaceId: string
  enabled: boolean
  writeKeys: string[]
  metadata: SourceListItemMetadata
}

interface SourcesListPagination {
  current: number
  previous?: string
  next?: string
  totalEntries: number
}

interface SourcesResponse {
  data: {
    sources: SourceListItem[]
    pagination: SourcesListPagination
  }
}

interface GetEngageSpaceParams {
  endpoint: string
  bearerToken: string
}

export async function getEngageSpaces(
  request: RequestClient,
  data: GetEngageSpaceParams
): Promise<DynamicFieldResponse> {
  let cursor = 'MA=='
  const choices: DynamicFieldItem[] = []
  let response: ModifiedResponse<SourcesResponse>

  const segmentPAPIEndpoint = SEGMENT_ENDPOINTS[data.endpoint || DEFAULT_SEGMENT_ENDPOINT].papi

  do {
    // https://api.segmentapis.build/sources?pagination%5Bcount%5D=<COUNT>&pagination%5Bcursor%5D=<PAGE>
    const publicApiUrl = `${segmentPAPIEndpoint}/sources?pagination%5Bcount%5D=${PAGINATION_COUNT}&pagination%5Bcursor%5D=${cursor}`

    try {
      response = await request<SourcesResponse>(publicApiUrl, {
        headers: {
          authorization: `Bearer ${data.bearerToken}`
        },
        method: 'GET',
        skipResponseCloning: true
      })

      for (const source of response.data.data.sources) {
        if (source.metadata.slug !== 'personas-compute') {
          continue
        }

        choices.push({
          label: source.name,
          value: source.writeKeys[0]
        })
      }
    } catch (err) {
      return {
        choices: [],
        error: {
          message: (err as SegmentPublicAPIError)?.response?.errors?.message ?? 'Unknown Error',
          code: (err as SegmentPublicAPIError)?.response?.statusText ?? 'Unknown Error'
        }
      }
    }

    if (response.data.data.pagination.next) {
      cursor = response.data.data.pagination.next
    }
  } while (response.data.data.pagination.next)

  return {
    choices
  }
}

export function generateSegmentAPIAuthHeaders(writeKey: string): string {
  // Segment's Tracking API uses HTTP Basic Authentication with the
  // Source Write Key. A colon needs to be added to the end of the
  // write key and then base64 encoded. Eg: BASE64(WriteKey + ':')
  return `Basic ${Buffer.from(writeKey + ':').toString('base64')}`
}
