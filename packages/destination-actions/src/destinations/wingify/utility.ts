import type { WingifyJSON } from './types'
import * as crypto from 'crypto'
import { Settings } from './generated-types'
import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { SegmentPayload } from './types'
const namespace = '11e13cd7-6c48-53ec-8679-7e9c752273c5'

export const hosts: { [key: string]: string } = {
  US: 'https://collect.wingify.net',
  EU: 'https://collect.wingify.net/eu01',
  AS: 'https://collect.wingify.net/as01'
}

function uuidv5(name: string, namespace: string): string {
  const namespaceBuffer = Buffer.from(namespace.replace(/-/g, ''), 'hex')
  const nameBuffer = Buffer.from(name)
  const hashBuffer = crypto.createHash('sha1').update(namespaceBuffer).update(nameBuffer).digest()
  hashBuffer[6] &= 0x0f
  hashBuffer[6] |= 0x50
  hashBuffer[8] &= 0x3f
  hashBuffer[8] |= 0x80
  const uuidSegments = [
    hashBuffer.subarray(0, 4).toString('hex'),
    hashBuffer.subarray(4, 6).toString('hex'),
    hashBuffer.subarray(6, 8).toString('hex'),
    hashBuffer.subarray(8, 10).toString('hex'),
    hashBuffer.subarray(10, 16).toString('hex')
  ]
  return uuidSegments.join('-')
}

function generate(name: string, namespace: string): string {
  if (!name || !namespace) {
    return ''
  }
  return uuidv5(name, namespace)
}

function formatJSON(name: string, payload: SegmentPayload, isCustomEvent: boolean, apiKey = '', accountId = 0): WingifyJSON {
  const wingifyUuid = apiKey.trim().length ? generateUUIDFor(payload.wingifyUuid, accountId) : payload.wingifyUuid

  const formattedProperties = 'properties' in payload && payload.properties ? { ...payload.properties } : {}
  delete formattedProperties['wingify_uuid']

  const rawAttributes = 'attributes' in payload && payload.attributes ? { ...payload.attributes } : {}
  delete rawAttributes['wingify_uuid']
  const formattedAttributes = formatAttributes(rawAttributes)

  const epochTime = new Date().valueOf()
  const sessionId = Math.floor(epochTime / 1000)

  const ogName = 'name' in payload ? payload.name : undefined
  const url = 'url' in payload ? payload.url : undefined

  const hasApiKey = apiKey.trim().length > 0
  const visitorProps = {
    ...formattedAttributes,
    ...(hasApiKey ? { wingify_fs_environment: apiKey } : {})
  }
  const visitor: WingifyJSON['d']['visitor'] =
    Object.keys(visitorProps).length > 0 ? { props: visitorProps } : undefined

  const json: WingifyJSON = {
    d: {
      msgId: `${wingifyUuid}-${sessionId}`,
      visId: wingifyUuid,
      event: {
        props: {
          ...formattedProperties,
          ...(url ? { url } : {}),
          page: payload.page
            ? {
                ...payload.page,
                referrerUrl: payload.page['referrer']
              }
            : {},
          isCustomEvent,
          wingifyMeta: {
            source: 'segment.cloud',
            ...(ogName ? { ogName } : {}),
            metric: {}
          },
          ...(visitor ? { $visitor: visitor } : {})
        },
        name,
        time: Math.floor(epochTime)
      },
      ...(visitor ? { visitor } : {}),
      sessionId
    }
  }

  return json
} 


function formatHeader(userAgent?: string, ip?: string): { [k: string]: string } {
  const headers: { [k: string]: string } = userAgent ? { 'User-Agent': userAgent } : {}

  if (ip) {
    headers['X-Forwarded-For'] = ip
  }
  return headers
}

function sanitiseEventName(name: string) {
  const trimmed = name.trim()
  if(!trimmed) {
    throw new PayloadValidationError('Event name cannot be empty or whitespace only')
  }
  return 'segment.' + name
}

function formatAttributes(attributes: { [k: string]: unknown } | undefined) {
  const formattedAttributes: { [k: string]: unknown } = {}
  if (!attributes) {
    return formattedAttributes
  }
  for (const key in attributes) {
    formattedAttributes[`segment.${key}`] = attributes[key]
  }
  return formattedAttributes
}

export function generateUUIDFor(userId: string | number, accountId: number) {
  userId = `${userId}` // type-cast
  const hash = `${accountId}`
  const userIdNamespace = generate(hash, namespace)
  const uuidForUserIdAccountId = generate(userId, userIdNamespace)
  const desiredUuid = uuidForUserIdAccountId.replace(/-/gi, '').toUpperCase()
  return desiredUuid
}

export function send(event: string, isCustomEvent: boolean, request: RequestClient, payload: SegmentPayload, settings: Settings, sanitise = true){
  const eventName = sanitise ? sanitiseEventName(event) : event
  const headers = formatHeader(payload.userAgent, payload.ip)
  const json = formatJSON(
    eventName,
    payload,
    isCustomEvent,
    settings.apikey,
    settings.wingifyAccountId
  )
  const region = settings.region || 'US'
  const host = hosts[region]
  const endpoint = `${host}/events/t?en=${eventName}&a=${settings.wingifyAccountId}`
  return request<WingifyJSON>(endpoint, {
    method: 'POST',
    json,
    headers
  })
}