// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'
import { IntegrationError } from '@segment/actions-core'
import { InputField } from '@segment/actions-core'
import { RequestClient, RequestOptions } from '@segment/actions-core'
import type { Logger, StatsClient, EngageDestinationCache } from '@segment/actions-core/destination-kit'
import type { Settings } from '../generated-types'
import { Liquid as LiquidJs } from 'liquidjs'
import { Profile, ResponseError } from '@segment/actions-shared'

const Liquid = new LiquidJs()

export type ApiLookupConfig = {
  id?: string | undefined
  name: string
  url: string
  method: string
  /** Cache ttl in ms */
  cacheTtl: number
  body?: string | undefined
  headers?: object | undefined
  responseType: string
  /** Whether the message should be retired (if the error code is retryable) when the data feed fails */
  shouldRetryOnRetryableError?: boolean
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Expected any type. */
type LogDataFeedError = (message: string, error?: any) => void

const renderLiquidFields = async (
  { url, body }: Pick<ApiLookupConfig, 'url' | 'body'>,
  profile: Profile,
  datafeedTags: string[],
  logDataFeedError: LogDataFeedError
) => {
  let renderedUrl: string
  let renderedBody: string | undefined
  try {
    renderedUrl = await Liquid.parseAndRender(url, { profile })
  } catch (error) {
    logDataFeedError('URL liquid render failuere', error)
    datafeedTags.push('error:true', 'reason:rendering_failure', 'rendering:url')
    throw new IntegrationError('Unable to parse data feed url', 'DATA_FEED_RENDERING_ERROR', 400)
  }
  try {
    renderedBody = body ? await Liquid.parseAndRender(body, { profile }) : undefined
  } catch (error) {
    logDataFeedError('Body liquid render failure', error)
    datafeedTags.push('error:true', 'reason:rendering_failure', 'rendering:body')
    throw new IntegrationError('Unable to parse email api lookup body', 'DATA_FEED_RENDERING_ERROR', 400)
  }

  return {
    renderedUrl,
    renderedBody
  }
}

export const getRequestId = ({ method, url, body, headers }: ApiLookupConfig) => {
  const requestHash = createHash('sha256')
  // We hash the request to make the key smaller and to prevent storage of any sensitive data within the config
  requestHash.update(`${method}${url}${body}${JSON.stringify(headers)}`)
  const requestId = requestHash.digest('hex')
  return requestId
}

export const getCachedResponse = async (
  { responseType }: ApiLookupConfig,
  requestId: string,
  engageDestinationCache: EngageDestinationCache,
  datafeedTags: string[]
) => {
  const cachedResponse = await engageDestinationCache.getByKey(requestId)
  if (!cachedResponse) {
    datafeedTags.push('cache_hit:false')
    return
  }

  datafeedTags.push('cache_hit:true')
  if (responseType === 'json') {
    return JSON.parse(cachedResponse)
  }
  return cachedResponse
}

export const performApiLookup = async (
  request: RequestClient,
  apiLookupConfig: ApiLookupConfig,
  profile: Profile,
  statsClient: StatsClient | undefined,
  tags: string[],
  settings: Settings,
  logger?: Logger | undefined,
  engageDestinationCache?: EngageDestinationCache | undefined
) => {
  const { id, method, headers, cacheTtl, name, shouldRetryOnRetryableError = true } = apiLookupConfig
  const datafeedTags = [
    ...tags,
    `datafeed_id:${id}`,
    `datafeed_name:${name}`,
    `space_id:${settings.spaceId}`,
    `cache_ttl_greater_than_0:${cacheTtl > 0}`,
    `retry_enabled:${shouldRetryOnRetryableError}`
  ]

  const logDataFeedError: LogDataFeedError = (message: string, error?: any) => {
    logger?.error(
      `TE Messaging: Data feed error - message: ${message} - data feed name: ${name} - data feed id: ${id} - space id: ${settings.spaceId} - raw error: ${error}`
    )
  }

  try {
    const { renderedUrl, renderedBody } = await renderLiquidFields(
      apiLookupConfig,
      profile,
      datafeedTags,
      logDataFeedError
    )

    const requestId = getRequestId({ ...apiLookupConfig, url: renderedUrl, body: renderedBody })

    if (cacheTtl > 0 && !engageDestinationCache) {
      logDataFeedError('Data feed cache not available and cache needed')
      datafeedTags.push('cache_set:false')
      throw new IntegrationError('Data feed cache not available and cache needed', 'DATA_FEED_CACHE_NOT_AVAILABLE', 400)
    }

    // First check for cached response before calling 3rd party api
    if (cacheTtl > 0 && engageDestinationCache) {
      const cachedResponse = await getCachedResponse(apiLookupConfig, requestId, engageDestinationCache, datafeedTags)
      if (cachedResponse) {
        datafeedTags.push('error:false')
        return cachedResponse
      }
    }

    // If not cached then call the 3rd party api
    let data
    try {
      const res = await request(renderedUrl, {
        headers: (headers as Record<string, string>) ?? undefined,
        timeout: 3000,
        method: method as RequestOptions['method'],
        body: renderedBody,
        skipResponseCloning: true
      })
      data = await res.data
    } catch (error: any) {
      const respError = error.response as ResponseError
      logDataFeedError('Data feed call failure', error)
      datafeedTags.push(`error:true`, `error_status:${respError?.status}`, 'reason:api_call_failure')

      // If retry is enabled for this data feed then rethrow the error to preserve centrifuge default retry logic
      if (shouldRetryOnRetryableError) {
        throw error
      }
      // Otherwise return empty data for this data feed
      return {}
    }

    // Then set the response in cache
    if (cacheTtl > 0 && engageDestinationCache) {
      const dataString = JSON.stringify(data)
      const size = Buffer.byteLength(dataString, 'utf-8')

      if (size > engageDestinationCache.maxValueSizeBytes) {
        datafeedTags.push('error:true', 'reason:response_size_too_big')
        logDataFeedError('Data feed response size too big too cache and caching needed, failing send')
        throw new IntegrationError(
          'Data feed response size too big too cache and caching needed, failing send',
          'DATA_FEED_RESPONSE_TOO_BIG',
          400
        )
      }

      try {
        await engageDestinationCache.setByKey(requestId, dataString, cacheTtl / 1000)
        datafeedTags.push('cache_set:true')
      } catch (error) {
        logDataFeedError('Data feed cache set failure', error)
        datafeedTags.push('error:true', 'reason:cache_set_failure', 'cache_set:false')
        throw error
      }
    }

    datafeedTags.push('error:false')
    return data
  } catch (error) {
    const isErrorCapturedInTags = datafeedTags.find((str) => str.includes('error:true'))
    if (!isErrorCapturedInTags) {
      datafeedTags.push('error:true', 'reason:unknown')
    }
    tags.push('reason:datafeed_failure')
    logDataFeedError('Unexpected data feed error', error)
    throw error
  } finally {
    statsClient?.incr('datafeed_execution', 1, datafeedTags)
  }
}

/** The action definition config fields representing a single API lookup */
export const apiLookupActionFields: Record<string, InputField> = {
  id: {
    label: 'ID',
    description: 'The id of the API lookup for use in logging & observability',
    type: 'string'
  },
  name: {
    label: 'Name',
    description: 'The name of the API lookup referenced in liquid syntax',
    type: 'string',
    required: true
  },
  url: {
    label: 'URL',
    description: 'The URL endpoint to call',
    type: 'string',
    required: true
  },
  method: {
    label: 'Request Method',
    description: 'The request method, e.g. GET/POST/etc.',
    type: 'string',
    required: true
  },
  cacheTtl: {
    label: 'Cache TTL',
    description: 'The cache TTL in ms',
    type: 'integer',
    required: true
  },
  body: {
    label: 'Request Body',
    description: 'The request body for use with POST/PUT/PATCH requests',
    type: 'string'
  },
  headers: {
    label: 'Request Headers',
    description: 'Headers in JSON to be sent with the request',
    type: 'object'
  },
  responseType: {
    label: 'Response Type',
    description: 'The response type of the request. Currently only supporting JSON.',
    type: 'string',
    required: true
  },
  shouldRetryOnRetryableError: {
    label: 'Should Retry',
    description:
      'Whether the message should be retried (if the error code is retryable) when the data feed fails or if it should be sent with empty data instead',
    type: 'boolean'
  }
}

export const apiLookupLiquidKey = 'datafeeds'

export const FLAGON_NAME_DATA_FEEDS = 'is-datafeeds-enabled'
