import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { InAppEventRequest } from '../types'
import { DEFAULT_CURRENCY, MAX_IN_APP_PAYLOAD_BYTES } from '../constants'
import {
  compact,
  formatInAppEventTime,
  normalizeDeviceType,
  resolveAppId,
  resolveAtt,
  resolveIdfv,
  sendInAppEvent,
  stringifyEventValue
} from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track In-App Event',
  description:
    'Send an in-app event to AppsFlyer. Note that server-side events are always classified as organic in AppsFlyer.',
  defaultSubscription: 'type = "track" and event != "Application Installed" and event != "Application Opened"',
  fields: {
    appsflyer_id: {
      label: 'AppsFlyer ID',
      description:
        'The AppsFlyer device identifier. If omitted, the advertising ID is used, then the User ID, then the Anonymous ID.',
      type: 'string',
      required: false,
      default: {
        // The classic destination read this through a case-insensitive lookup, so both
        // spellings appear in customer payloads. Check both so neither silently drops.
        '@if': {
          exists: { '@path': '$.integrations.AppsFlyer.appsflyer_id' },
          then: { '@path': '$.integrations.AppsFlyer.appsflyer_id' },
          else: { '@path': '$.integrations.AppsFlyer.appsFlyerId' }
        }
      }
    },
    device_type: {
      label: 'Device Type',
      description: 'The device platform. Must be `ios`, `android` or `roku`.',
      type: 'string',
      required: true,
      default: { '@path': '$.context.device.type' }
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    event_value: {
      label: 'Event Properties',
      description:
        'Properties of the event. Serialized to a JSON string with all values quoted, as AppsFlyer requires. A `revenue` property is sent as `af_revenue`.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    event_currency: {
      label: 'Currency',
      description: 'The currency of any revenue value, as an ISO 4217 code. Defaults to USD.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.currency' }
    },
    event_time: {
      label: 'Event Time',
      description: 'When the event occurred.',
      type: 'datetime',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    uid: {
      label: 'User ID',
      description: 'Your own identifier for the user.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'The Segment anonymous ID, used as a fallback identifier.',
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    os_version: {
      label: 'OS Version',
      description: 'The device OS version. Required by AppsFlyer for iOS in-app events.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.os.version' }
    },
    ip: {
      label: 'IP Address',
      description: 'The device IP address.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.ip' }
    },
    advertising_id: {
      label: 'Advertising ID',
      description: 'The device advertising ID. Sent as `idfa` on iOS and `advertising_id` on Android and Roku.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.device.advertisingId' }
    },
    device_id: {
      label: 'Device ID',
      description: 'The iOS vendor identifier, used when the advertising ID is unavailable or zeroed out.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.device.id' }
    },
    bundle_id: {
      label: 'Bundle ID',
      description: 'The app bundle identifier. Sent for iOS only.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.app.namespace' }
    },
    att: {
      label: 'ATT Status',
      description: 'The iOS App Tracking Transparency status. Sent for iOS only.',
      type: 'number',
      required: false,
      default: { '@path': '$.context.device.att' }
    },
    counter: {
      label: 'App Open Counter',
      description: 'The historical number of times the app has been opened by this user.',
      type: 'number',
      required: false,
      default: { '@path': '$.integrations.AppsFlyer.counter' }
    },
    referrer: {
      label: 'Referrer',
      description: 'The Google Play store referrer. Sent for Android and Roku only.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.referrer.url' }
    },
    consent_data: {
      label: 'Consent Data',
      description: 'Consent information to forward to AppsFlyer.',
      type: 'object',
      required: false,
      default: { '@path': '$.integrations.AppsFlyer.consent_data' }
    }
  },

  perform: (request, { payload, settings }) => {
    const deviceType = normalizeDeviceType(payload.device_type)
    const appId = resolveAppId(settings, deviceType)

    // AppsFlyer requires some stable device identifier. The classic destination walked this
    // same chain, so existing customers keep the identity resolution they already have.
    const appsflyerId = payload.appsflyer_id || payload.advertising_id || payload.uid || payload.anonymous_id
    if (!appsflyerId) {
      throw new PayloadValidationError(
        'AppsFlyer requires a device identifier. Provide an AppsFlyer ID, an Advertising ID, a User ID or an Anonymous ID.'
      )
    }

    const isIos = deviceType === 'ios'
    const body: InAppEventRequest = compact({
      appsflyer_id: appsflyerId,
      eventName: payload.event_name,
      eventValue: stringifyEventValue(payload.event_value),
      eventCurrency: payload.event_currency || DEFAULT_CURRENCY,
      eventTime: formatInAppEventTime(payload.event_time),
      af_events_api: 'true',
      uid: payload.uid || payload.anonymous_id,
      os: payload.os_version,
      ip: payload.ip,
      // AppsFlyer asked for Android advertising IDs to be lowercased.
      idfa: isIos ? payload.advertising_id : undefined,
      advertising_id: isIos
        ? undefined
        : deviceType === 'android'
        ? payload.advertising_id?.toLowerCase()
        : payload.advertising_id,
      idfv: isIos ? resolveIdfv(payload.advertising_id, appsflyerId, payload.device_id) : undefined,
      bundle_id: isIos ? payload.bundle_id : undefined,
      att: isIos ? resolveAtt(payload.att, payload.os_version) : undefined,
      counter: payload.counter,
      referrer: isIos ? undefined : payload.referrer,
      consent_data: payload.consent_data
    }) as InAppEventRequest

    // AppsFlyer rejects payloads over 1KB. The classic destination let these through and
    // they were dropped downstream with no signal, so we surface it instead.
    const size = Buffer.byteLength(JSON.stringify(body), 'utf8')
    if (size > MAX_IN_APP_PAYLOAD_BYTES) {
      throw new PayloadValidationError(
        `This event is ${size} bytes, which exceeds AppsFlyer's ${MAX_IN_APP_PAYLOAD_BYTES} byte limit. ` +
          'Reduce the number or size of the event properties being sent.'
      )
    }

    return sendInAppEvent(request, settings, appId, body)
  }
}

export default action
