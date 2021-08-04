interface UTMProperties {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

interface PayloadUTM {
  utm_properties?: UTMProperties
}

interface InitialUTMProperties {
  initial_utm_source?: string
  initial_utm_medium?: string
  initial_utm_campaign?: string
  initial_utm_term?: string
  initial_utm_content?: string
}

export interface EventUTM {
  $set?: UTMProperties
  $setOnce?: InitialUTMProperties
}

const getKeys = <T>(obj: T) => Object.keys(obj) as Array<keyof T>

/**
 * Take a compatible event type that contains a `utm_properties` key and convert it to an object formatted for amplitude's API
 *
 * @param payload an event payload that contains a utm_properties property
 * @returns an object with $set and $setOnce params set according how amplitude would like us to handle UTM properties
 */
export function getUTMProperties(payload: PayloadUTM): EventUTM {
  if (!payload.utm_properties) return {}
  const set: UTMProperties = {}
  const setOnce: InitialUTMProperties = {}
  const utm = payload.utm_properties
  getKeys(utm).forEach((key) => {
    set[key] = utm[key]
    setOnce[`initial_${key}` as keyof InitialUTMProperties] = utm[key]
  })
  return {
    $set: set,
    $setOnce: setOnce
  }
}
