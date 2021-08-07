import { AmplitudeEvent } from './logEvent'
import { AmplitudeUserProperties } from './merge-user-properties'

interface Payload {
  utm_properties?: UTMProperties
  user_properties?: AmplitudeUserProperties
}

interface UTMProperties {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

interface InitialUTMProperties {
  initial_utm_source?: string
  initial_utm_medium?: string
  initial_utm_campaign?: string
  initial_utm_term?: string
  initial_utm_content?: string
}

/**
 * Take a compatible payload that contains a `utm_properties` key and converts it to a user_properties object suitable for injection into an amplitude event
 *
 * @param payload an event payload that contains a utm_properties property
 * @returns a mutated payload with user_properties set based on utm_properties and the utm_properties key removed
 */
export function convertUTMProperties(payload: Payload): AmplitudeUserProperties {
  const { utm_properties, ...rest } = payload

  if (!utm_properties) return {}

  const cleanedPayload = rest as AmplitudeEvent
  const set: UTMProperties = {}
  const setOnce: InitialUTMProperties = {}

  Object.entries(utm_properties).forEach(([key, value]) => {
    set[key as keyof UTMProperties] = value
    setOnce[`initial_${key}` as keyof InitialUTMProperties] = value
  })

  let userProperties: AmplitudeUserProperties

  if (cleanedPayload.user_properties) {
    userProperties = { ...cleanedPayload.user_properties }

    userProperties.$set = { ...userProperties.$set, ...set }
    userProperties.$setOnce = { ...userProperties.$setOnce, ...setOnce }
  } else {
    userProperties = {
      $set: set,
      $setOnce: setOnce
    }
  }

  return userProperties
}
