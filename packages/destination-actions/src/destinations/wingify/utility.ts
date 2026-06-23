import type { commonPayload, wingifyPayload } from './types'
import * as crypto from 'crypto'

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

export function formatPayload(
  name: string,
  payload: commonPayload,
  isCustomEvent: boolean,
  isTrack = false,
  apiKey = '',
  accountId = 0
) {
  let formattedProperties: { [k: string]: unknown } = {}
  const wingifyUuid = apiKey.trim().length ? generateUUIDFor(payload.wingifyUuid, accountId) : payload.wingifyUuid
  if (isTrack) {
    formattedProperties = { ...payload.properties }
    delete formattedProperties['wingify_uuid']
  }
  const epochTime = new Date().valueOf()
  const time = Math.floor(epochTime)
  const sessionId = Math.floor(epochTime / 1000)
  const page = payload.page
    ? {
        ...payload.page,
        referrerUrl: payload.page['referrer']
      }
    : {}
  const structuredPayload: wingifyPayload = {
    d: {
      msgId: `${wingifyUuid}-${sessionId}`,
      visId: wingifyUuid,
      event: {
        props: {
          ...formattedProperties,
          page,
          isCustomEvent,
          wingifyMeta: {
            source: 'segment.cloud',
            metric: {}
          }
        },
        name,
        time
      },
      sessionId
    }
  }
  const headers: { [k: string]: string } = payload.userAgent
    ? {
        'User-Agent': payload.userAgent
      }
    : {}

  if (apiKey.trim().length) {
    const visitorObj = {
      props: {
        wingify_fs_environment: apiKey
      }
    }
    structuredPayload.d.event.props.$visitor = visitorObj
    structuredPayload.d.visitor = visitorObj
  }

  if (payload.ip) {
    headers['X-Forwarded-For'] = payload.ip
  }
  return { headers, structuredPayload }
}

export function sanitiseEventName(name: string) {
  return 'segment.' + name
}

export function formatAttributes(attributes: { [k: string]: unknown } | undefined) {
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
