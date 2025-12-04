import UaParser from '@amplitude/ua-parser-js'
import { AMPLITUDE_ATTRIBUTION_KEYS } from '@segment/actions-shared'
import { Payload as LogEventPayload} from './logEvent/generated-types'
import { Payload as LogEventV2Payload} from './logEventV2/generated-types'
import { Payload as PurchasePayload } from './logPurchase/generated-types'
import { Payload as IdentifyUserPayload} from './identifyUser/generated-types'
import { UserProperties, UserAgentData, ParsedUA, Region } from './types'

export function getUserProperties(payload: LogEventPayload | LogEventV2Payload | PurchasePayload | IdentifyUserPayload): UserProperties {
    const { 
        autocaptureAttributionEnabled,
        autocaptureAttributionSet,
        autocaptureAttributionSetOnce,
        autocaptureAttributionUnset,
        user_properties
    } = payload

    let setOnce: UserProperties['$setOnce'] = {}
    let setAlways: UserProperties['$set'] = {}
    let add: UserProperties['$add'] = {}

    if ('utm_properties' in payload || 'referrer' in payload) {
      // For LogPurchase and LogEvent Actions
      const { utm_properties, referrer } = payload
      setAlways = {
        ...(referrer ? { referrer } : {}),
        ...(utm_properties || {})
      }
      setOnce = {
        ...(referrer ? { initial_referrer: referrer } : {}),
        ...(utm_properties
          ? Object.fromEntries(Object.entries(utm_properties).map(([k, v]) => [`initial_${k}`, v]))
          : {})
      }
    } 
    else if ('setOnce' in payload || 'setAlways' in payload || 'add' in payload){
      // For LogEventV2 Action
      setOnce = payload.setOnce as UserProperties['$setOnce']
      setAlways = payload.setAlways as UserProperties['$set']
      add = payload.add as UserProperties['$add']
    }

    if (autocaptureAttributionEnabled) {
      // If autocapture attribution is enabled, we need to make sure that attribution keys are not sent from the setAlways and setOnce fields
      for (const key of AMPLITUDE_ATTRIBUTION_KEYS) {
        if( typeof setAlways === "object" && setAlways !== null){
          delete setAlways[key]
        }
        if(typeof setOnce === "object" && setOnce !== null){
          delete setOnce[`initial_${key}`]
        }
      }
    }

    const userProperties = {
      ...user_properties,
      ...(compact(autocaptureAttributionEnabled ? { ...setOnce, ...autocaptureAttributionSetOnce } as { [k: string]: string } : setOnce as { [k: string]: string })
        ? { $setOnce: autocaptureAttributionEnabled ? { ...setOnce, ...autocaptureAttributionSetOnce } as { [k: string]: string }: setOnce as { [k: string]: string }}
        : {}),
      ...(compact(autocaptureAttributionEnabled ? { ...setAlways, ...autocaptureAttributionSet } as { [k: string]: string }: setAlways as { [k: string]: string }) 
        ? { $set: autocaptureAttributionEnabled ? { ...setAlways, ...autocaptureAttributionSet } as { [k: string]: string }: setAlways as { [k: string]: string }}
        : {}),
      ...(compact(add) ? { $add: add as { [k: string]: string } } : {}),
      ...(compact(autocaptureAttributionEnabled ? autocaptureAttributionUnset as { [k: string]: string } : {}) 
        ? { $unset: autocaptureAttributionEnabled ? autocaptureAttributionUnset as { [k: string]: string } : {} as { [k: string]: string } } 
        : {})
    }
    return userProperties
}

function compact(object: { [k: string]: unknown } | undefined): boolean {
  return Object.keys(Object.fromEntries(Object.entries(object ?? {}).filter(([_, v]) => v !== ''))).length > 0
}

export const endpoints = {
  batch: {
    north_america: 'https://api2.amplitude.com/batch',
    europe: 'https://api.eu.amplitude.com/batch'
  },
  deletions: {
    north_america: 'https://amplitude.com/api/2/deletions/users',
    europe: 'https://analytics.eu.amplitude.com/api/2/deletions/users'
  },
  httpapi: {
    north_america: 'https://api2.amplitude.com/2/httpapi',
    europe: 'https://api.eu.amplitude.com/2/httpapi'
  },
  identify: {
    north_america: 'https://api2.amplitude.com/identify',
    europe: 'https://api.eu.amplitude.com/identify'
  },
  groupidentify: {
    north_america: 'https://api2.amplitude.com/groupidentify',
    europe: 'https://api.eu.amplitude.com/groupidentify'
  },
  usermap: {
    north_america: 'https://api.amplitude.com/usermap',
    europe: 'https://api.eu.amplitude.com/usermap'
  },
  usersearch: {
    north_america: 'https://amplitude.com/api/2/usersearch',
    europe: 'https://analytics.eu.amplitude.com/api/2/usersearch'
  }
}

/**
 * Retrieves Amplitude API endpoints for a given region. If the region
 * provided does not exist, the region defaults to 'north_america'.
 *
 * @param endpoint name of the API endpoint
 * @param region data residency region
 * @returns regional API endpoint
 */
export function getEndpointByRegion(endpoint: keyof typeof endpoints, region?: string): string {
  return endpoints[endpoint][region as Region] ?? endpoints[endpoint]['north_america']
}

export function parseUserAgentProperties(userAgent?: string, userAgentData?: UserAgentData): ParsedUA {
  if (!userAgent) {
    return {}
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const parser = new UaParser(userAgent)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const device = parser.getDevice()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const os = parser.getOS()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const browser = parser.getBrowser()

  return {
    os_name: os.name ?? browser.name,
    os_version: userAgentData?.platformVersion ?? browser.major,
    device_manufacturer: device.vendor,
    device_model: userAgentData?.model ?? device.model ?? os.name,
    device_type: device.type
  }
}
