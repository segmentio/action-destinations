import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { s2sCommonFields } from '../properties'
import {
  buildS2SRequest,
  formatS2STimestamp,
  generateAfSig,
  mapReferrers,
  normalizeDeviceType,
  resolveAppId,
  sendS2SEvent
} from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Application Installed',
  description: 'Report a first app open to AppsFlyer as an install.',
  defaultSubscription: 'type = "track" and event = "Application Installed"',
  fields: {
    ...s2sCommonFields,
    deeplink: {
      label: 'Deeplink',
      description: 'The full deeplink URL that opened the app.',
      type: 'string',
      required: false,
      default: { '@path': '$.integrations.AppsFlyer.af_deeplink' }
    },
    custom_data: {
      label: 'Custom Data',
      description: 'Additional custom data to forward to AppsFlyer.',
      type: 'object',
      required: false,
      default: { '@path': '$.integrations.AppsFlyer.custom_data' }
    },
    asa_data: {
      label: 'Apple Search Ads Data',
      description: 'Apple Search Ads attribution data. Sent for iOS only.',
      type: 'string',
      required: false,
      default: { '@path': '$.integrations.AppsFlyer.asa_data' }
    },
    referrers: {
      label: 'Google Play Referrers',
      description:
        'Google Play install referrers. Keys are remapped to the names AppsFlyer expects. Sent for Android only.',
      type: 'object',
      multiple: true,
      required: false,
      default: { '@path': '$.integrations.AppsFlyer.referrers' }
    },
    referrer: {
      label: 'Referrer',
      description: 'The Google Play store referrer URL. Sent for Android and Roku only.',
      type: 'string',
      required: false,
      default: { '@path': '$.context.referrer.url' }
    }
  },

  perform: (request, { payload, settings }) => {
    if (!settings.devKey) {
      throw new PayloadValidationError(
        'Application Installed events are signed with your AppsFlyer Dev Key. Add it in the destination settings.'
      )
    }

    const deviceType = normalizeDeviceType(payload.device_type)
    const appId = resolveAppId(settings, deviceType)

    const body = buildS2SRequest(payload, deviceType, {
      // For an install, the event timestamp is the install date by definition.
      instDate: formatS2STimestamp(payload.timestamp),
      // This event is the first open for this user, so the historical count is always 1.
      counter: 1,
      existingUser: 'false'
    })

    if (payload.deeplink) body.af_deeplink = payload.deeplink
    if (payload.custom_data) body.custom_data = payload.custom_data
    if (payload.asa_data && deviceType === 'ios') body.asa_data = payload.asa_data
    if (payload.referrers && deviceType === 'android') body.referrers = mapReferrers(payload.referrers)
    if (payload.referrer && deviceType !== 'ios') body.referrer = payload.referrer

    const afSig = generateAfSig(settings.devKey, body.timestamp, body.ip, body.lang)

    return sendS2SEvent(request, settings, appId, body, afSig)
  }
}

export default action
