import { Payload as IdentifyPayload } from './identifyUser/generated-types'
import { Payload as LogPayload } from './logEvent/generated-types'
import { AmplitudeEvent } from './logEvent'
import { AmplitudeUserProperties } from './merge-user-properties'
type Payload = IdentifyPayload | LogPayload

/**
 * takes a payload object and converts it to a valid user_properties object for use in amplitude events
 *
 * @param payload an identify or log payload
 * @returns a valid user_properties object suitable for injection into an AmplitudeEvent
 */
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
