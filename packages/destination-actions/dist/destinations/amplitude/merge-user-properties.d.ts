export interface AmplitudeUserProperties {
  $set?: object
  $setOnce?: object
  [k: string]: unknown
}
export declare function mergeUserProperties(...properties: AmplitudeUserProperties[]): AmplitudeUserProperties
