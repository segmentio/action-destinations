import { AMPLITUDE_ATTRIBUTION_KEYS } from '@segment/actions-shared'
import { Payload } from './generated-types'

export const DESTINATION_INTEGRATION_NAME = 'Actions Amplitude'

function compact(object: { [k: string]: unknown } | undefined): boolean {
  return Object.keys(Object.fromEntries(Object.entries(object ?? {}).filter(([_, v]) => v !== ''))).length > 0
}

export function getUserProperties(payload: Payload): { [k: string]: unknown } {
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
      ...(compact(autocaptureAttributionEnabled ? { ...setOnce, ...autocaptureAttributionSetOnce } : setOnce)
        ? { $setOnce: autocaptureAttributionEnabled ? { ...setOnce, ...autocaptureAttributionSetOnce } : setOnce }
        : {}),
      ...(compact(autocaptureAttributionEnabled ? { ...setAlways, ...autocaptureAttributionSet } : setAlways)
        ? { $set: autocaptureAttributionEnabled ? { ...setAlways, ...autocaptureAttributionSet } : setAlways }
        : {}),
      ...(compact(add) ? { $add: add } : {}),
      ...(autocaptureAttributionUnset && autocaptureAttributionUnset.length > 0
        ? { $unset: autocaptureAttributionUnset }
        : {})
    }

    return userProperties
}








  