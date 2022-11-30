import type { commonPayload, vwoPayload } from './types'

// const eventApiMaxLength = 30

export function formatPayload(name: string, payload: commonPayload, isCustomEvent: boolean, isTrack = false) {
  let formattedProperties: { [k: string]: unknown } = {}
  const vwoUuid = payload.vwoUuid
  if (isTrack) {
    formattedProperties = { ...payload.properties }
    delete formattedProperties['vwo_uuid']
  }
  const epochTime = new Date(payload.timestamp).valueOf()
  const time = Math.floor(epochTime)
  const sessionId = Math.floor(epochTime / 1000)
  const page = {
    ...payload.page,
    referrerUrl: payload.page['referrer']
  }
  const structuredPayload: vwoPayload = {
    d: {
      msgId: `${vwoUuid}-${sessionId}`,
      visId: vwoUuid,
      event: {
        props: {
          ...formattedProperties,
          page,
          isCustomEvent,
          vwoMeta: {
            vwo_source: 'segment.cloud',
            metric: {}
          }
        },
        name,
        time
      },
      sessionId
    }
  }
  const headers: { [k: string]: string } = {
    'User-Agent': payload.userAgent
  }

  if (payload.ip) {
    headers['X-Forwarded-For'] = payload.ip
  }
  return { headers, structuredPayload }
}

// function toCamelCase(text: string) {
//   return text
//     .toLowerCase()
//     .replace(/[^\w\s-](.)/g, function (x) {
//       return x.toUpperCase()
//     })
//     .replace(/[^\w\s-]/g, '')
//     .replace(/ (.)/g, function (x) {
//       return x.toUpperCase()
//     })
//     .replace(/ /g, '')
// }

// function vwoEventNameValidation(apiName: string) {
//   const regex = /[^\w-]/g
//   const regex2 = /^(_|vwo_|v_|i_|-)*/g

//   apiName = apiName.replace(regex, '')
//   apiName = apiName.replace(regex2, '')
//   apiName = apiName.charAt(0).toLowerCase().concat(apiName.slice(1))

//   if (apiName.toLowerCase() === 'visitors') {
//     apiName += '_1'
//   }
//   return apiName
// }

export function sanitiseEventName(name: string) {
  // let eventApiName = toCamelCase(name)
  // eventApiName = eventApiName.charAt(0).toLowerCase().concat(eventApiName.slice(1))
  // eventApiName = vwoEventNameValidation(eventApiName)
  // eventApiName = eventApiName.slice(0, eventApiMaxLength)
  // return eventApiName
  return 'segment_' + name
}

export function formatAttributes(attributes: { [k: string]: unknown } | undefined) {
  const formattedAttributes: { [k: string]: unknown } = {}
  for (const key in attributes) {
    formattedAttributes[`segment_${key}`] = attributes[key]
  }
  return formattedAttributes
}
