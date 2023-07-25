import { IntegrationError } from '@segment/actions-core'
import { InputField } from '@segment/actions-core'
import { RequestClient, RequestOptions } from '@segment/actions-core'
import { Logger, StatsClient } from '@segment/actions-core/destination-kit'
import type { Settings } from '../generated-types'
import { Liquid as LiquidJs } from 'liquidjs'
import { Profile } from '../Profile'

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

export const performApiLookup = async (
  request: RequestClient,
  { id, url, method, body, headers }: ApiLookupConfig,
  profile: Profile,
  statsClient: StatsClient | undefined,
  tags: string[],
  settings: Settings,
  logger?: Logger | undefined
) => {
  let renderedUrl: string
  let renderedBody: string | undefined
  try {
    renderedUrl = await Liquid.parseAndRender(url, { profile })
  } catch (error) {
    logger?.error(
      `TE Messaging: Email api lookup url parse failure - api lookup id: ${id} - ${settings.spaceId} - [${error}]`
    )
    tags.push('reason:parse_apilookup_url')
    statsClient?.incr('actions-personas-messaging-sendgrid-error', 1, tags)
    throw new IntegrationError('Unable to parse email api lookup url', 'api lookup url parse failure', 400)
  }
  try {
    renderedBody = body ? await Liquid.parseAndRender(body, { profile }) : undefined
  } catch (error) {
    logger?.error(
      `TE Messaging: Email api lookup body parse failure - api lookup id: ${id} - ${settings.spaceId} - [${error}]`
    )
    tags.push('reason:parse_apilookup_body')
    statsClient?.incr('actions-personas-messaging-sendgrid-error', 1, tags)
    throw new IntegrationError('Unable to parse email api lookup body', 'api lookup body parse failure', 400)
  }

  try {
    const res = await request(renderedUrl, {
      headers: (headers as Record<string, string>) ?? undefined,
      timeout: 10000,
      method: method as RequestOptions['method'],
      body: renderedBody,
      skipResponseCloning: true
    })
    return res.data
  } catch (error) {
    logger?.error(`TE Messaging: Email api lookup failure - api lookup id: ${id} - ${settings.spaceId} - [${error}]`)
    tags.push('reason:apilookup_failure')
    statsClient?.incr('actions-personas-messaging-sendgrid-error', 1, tags)
    // Rethrow error to preserve default http retry logic
    throw error
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
