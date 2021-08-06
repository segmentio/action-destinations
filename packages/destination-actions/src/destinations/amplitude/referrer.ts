import { Payload as IdentifyPayload } from './identifyUser/generated-types'
import { Payload as LogPayload } from './logEvent/generated-types'
import { AmplitudeEvent } from './logEvent'
import { AmplitudeUserProperties } from './utm'
type Payload = IdentifyPayload | LogPayload

//TODO: this needs to handle set and setOnce for referrer just like utm
export function convertReferrerProperty(payload: Payload): AmplitudeUserProperties {
  const { referrer, ...rest } = payload

  if (!referrer) return {}
  const cleanedPayload = rest as AmplitudeEvent

  let userProperties: AmplitudeUserProperties
  if (cleanedPayload.user_properties) {
    userProperties = cleanedPayload.user_properties

    userProperties.$set = { ...userProperties.$set, referrer }
    userProperties.$setOnce = { ...userProperties.$setOnce, initial_referrer: referrer }
  } else {
    userProperties = {
      $set: { referrer },
      $setOnce: { initial_referrer: referrer }
    }
  }
  return userProperties
}
