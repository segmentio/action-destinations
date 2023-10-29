import { createHash } from 'crypto'
import { IntegrationError } from '@segment/actions-core'
import { InputField } from '@segment/actions-core'
import { RequestClient, RequestOptions } from '@segment/actions-core'
import { Logger, StatsClient, RequestCache } from '@segment/actions-core/destination-kit'
import type { Settings } from '../generated-types'
import { Liquid as LiquidJs } from 'liquidjs'
import { Profile } from '../Profile'
import { ResponseError } from '@segment/actions-core/create-request-client'

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
}

const renderLiquidFields = async (
  { id, url, body }: Pick<ApiLookupConfig, 'id' | 'url' | 'body'>,
  profile: Profile,
  datafeedTags: string[],
  settings: Settings,
  logger?: Logger | undefined
) => {
  let renderedUrl: string
  let renderedBody: string | undefined
  try {
    renderedUrl = await Liquid.parseAndRender(url, { profile })
  } catch (error) {
    logger?.error(
      `TE Messaging: Email datafeed url parse failure - api lookup id: ${id} - ${settings.spaceId} - [${error}]`
    )
    datafeedTags.push('error:true', `error_message:${error?.message}`, 'reason:rendering_failure', 'rendering:url')
    throw new IntegrationError('Unable to parse email api lookup url', 'api lookup url parse failure', 400)
  }
  try {
    renderedBody = body ? await Liquid.parseAndRender(body, { profile }) : undefined
  } catch (error) {
    logger?.error(
      `TE Messaging: Email datafeed body parse failure - api lookup id: ${id} - ${settings.spaceId} - [${error}]`
    )
    datafeedTags.push('error:true', `error_message:${error?.message}`, 'reason:rendering_failure', 'rendering:body')
    throw new IntegrationError('Unable to parse email api lookup body', 'api lookup body parse failure', 400)
  }

  return {
    renderedUrl,
    renderedBody
  }
}

const getRequestId = ({ method, url, body, headers }: ApiLookupConfig) => {
  const requestHash = createHash('sha256')
  // We hash the request to make the key smaller and to prevent storage of any sensitive data within the config
  requestHash.update(`${method}${url}${body}${headers}`)
  const requestId = requestHash.digest('hex')
  return requestId
}

export const performApiLookup = async (
  request: RequestClient,
  apiLookupConfig: ApiLookupConfig,
  profile: Profile,
  statsClient: StatsClient | undefined,
  tags: string[],
  settings: Settings,
  logger?: Logger | undefined,
  requestCache?: RequestCache | undefined
) => {
  const { id, method, headers, cacheTtl, responseType, name } = apiLookupConfig
  const datafeedTags = [
    ...tags,
    `datafeed_id:${id}`,
    `datafeed_name:${name}`,
    `space_id:${settings.spaceId}`,
    `cache_ttl:${cacheTtl}`
  ]

  try {
    const { renderedUrl, renderedBody } = await renderLiquidFields(
      apiLookupConfig,
      profile,
      datafeedTags,
      settings,
      logger
    )
    const requestId = getRequestId({ ...apiLookupConfig, url: renderedUrl, body: renderedBody })
    datafeedTags.push(`cache_request_id:${requestId}`)

    if (cacheTtl > 0) {
      const cachedResponse = await requestCache?.getRequestResponse(requestId)
      if (cachedResponse) {
        datafeedTags.push('cache-hit:true')
        datafeedTags.push('error:false')
        return responseType === 'json' ? JSON.parse(cachedResponse) : cachedResponse
      }
      datafeedTags.push('cache-hit:false')
    }

    let data
    try {
      const res = await request(renderedUrl, {
        headers: (headers as Record<string, string>) ?? undefined,
        timeout: 2000,
        method: method as RequestOptions['method'],
        body: renderedBody,
        skipResponseCloning: true
      })
      data = res.data
    } catch (error: any) {
      const respError = error.response as ResponseError
      logger?.error(`TE Messaging: Email api lookup failure - api lookup id: ${id} - ${settings.spaceId} - [${error}]`)
      console.log(error)
      datafeedTags.push(
        `error:true`,
        `error_message:${error.message}`,
        `error_status:${respError?.status}`,
        'reason:api_call_failure'
      )
      // Rethrow error to preserve default http retry logic
      throw error
    }

    try {
      const size = Buffer.byteLength(data as string, 'utf-8')
      datafeedTags.push(`response_size:${size}`)
      if (cacheTtl > 0 && size > 1000000) {
        datafeedTags.push('cache-set:false')
      } else {
        try {
          await requestCache?.setRequestResponse(requestId, data as string, cacheTtl)
          datafeedTags.push('cache-set:true')
        } catch (err) {
          datafeedTags.push('cache-set:false')
          datafeedTags.push('error:true', 'reason:cache_set_failure', `error_message:${err?.message}`)
          throw err
        }
      }
    } catch (error) {
      logger?.error(
        `TE Messaging: Email api lookup cache set failure - api lookup id: ${id} - ${settings.spaceId} - [${error}]`
      )
      statsClient?.incr('actions-personas-messaging-sendgrid-error', 1, tags)
    }

    return data
  } catch (err) {
    const isErrorCapturedInTags = datafeedTags.find((str) => str.includes('error:true'))
    if (!isErrorCapturedInTags) {
      datafeedTags.push('error:true', `error_message:${err?.message}`, 'reason:unknown')
    }
    tags.push('reason:datafeed_failure')
    logger?.error(`TE Messaging: Email api lookup failure - api lookup id: ${id} - ${settings.spaceId} - [${err}]`)
    throw err
  } finally {
    console.log(datafeedTags)
    statsClient?.incr('datafeed-execution', 1, datafeedTags)
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
  }
}

export const apiLookupLiquidKey = 'lookups'
