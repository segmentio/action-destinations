export interface AmplitudeUserProperties {
  $set?: object
  $setOnce?: object
  [k: string]: unknown
}

export function mergeUserProperties(...properties: AmplitudeUserProperties[]): AmplitudeUserProperties {
  return properties.reduce((prev, current) => {
    return {
      ...current,
      $set: { ...prev.$set, ...current.$set },
      $setOnce: { ...prev.$setOnce, ...current.$setOnce }
    }
  }, {})
}
