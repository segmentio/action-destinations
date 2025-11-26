import { AMPLITUDE_ATTRIBUTION_KEYS } from '@segment/actions-shared'
import { Payload } from './generated-types'
import { UserProperties } from './types'

function compact(object: { [k: string]: unknown } | undefined): boolean {
  return Object.keys(Object.fromEntries(Object.entries(object ?? {}).filter(([_, v]) => v !== ''))).length > 0
}

export function getUserProperties(payload: Payload): UserProperties {
    const { 
        setOnce, 
        setAlways,
        add,
        autocaptureAttributionEnabled,
        autocaptureAttributionSet,
        autocaptureAttributionSetOnce,
        autocaptureAttributionUnset,
        user_properties
    } = payload

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
      ...(compact(autocaptureAttributionUnset) ? { $unset: autocaptureAttributionUnset as { [k: string]: string } } : {}),
    }

    return userProperties
}








  