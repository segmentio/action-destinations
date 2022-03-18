import { Payload as IdentifyPayload } from './identifyUser/generated-types'
import { Payload as LogPayload } from './logEvent/generated-types'
import { AmplitudeUserProperties } from './merge-user-properties'
declare type Payload = IdentifyPayload | LogPayload
export declare function convertReferrerProperty(payload: Payload): AmplitudeUserProperties
export {}
