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
export declare function convertUTMProperties(payload: Payload): AmplitudeUserProperties
export {}
