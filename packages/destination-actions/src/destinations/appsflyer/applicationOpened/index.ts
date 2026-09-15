import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { s2sCommonFields } from '../properties'
import {
  buildS2SRequest,
  formatS2STimestamp,
  generateAfSig,
  normalizeDeviceType,
  resolveAppId,
  sendS2SEvent
} from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Application Opened',
  description: 'Report a repeat app open to AppsFlyer.',
  defaultSubscription: 'type = "track" and event = "Application Opened"',
  fields: {
    ...s2sCommonFields,
    install_date: {
      label: 'Install Date',
      description:
        'When this user originally installed the app. Segment cannot derive this, so it must be supplied on the event.',
      type: 'datetime',
      required: true,
      default: { '@path': '$.integrations.AppsFlyer.install_date' }
    },
    counter: {
      label: 'App Open Counter',
      description:
        'The historical number of times this user has opened the app. Segment does not track this, so it must be supplied on the event.',
      type: 'number',
      required: true,
      default: { '@path': '$.integrations.AppsFlyer.counter' }
    },
    deeplink: {
      label: 'Deeplink',
      description: 'The full deeplink URL that opened the app.',
      type: 'string',
      required: false,
      // Note the key differs from Application Installed, which reads `af_deeplink`. This
      // mirrors the classic destination so existing customer payloads keep working.
      default: { '@path': '$.integrations.AppsFlyer.deep_link' }
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
        'Application Opened events are signed with your AppsFlyer Dev Key. Add it in the destination settings.'
      )
    }

    const deviceType = normalizeDeviceType(payload.device_type)
    const appId = resolveAppId(settings, deviceType)

    const installDate = new Date(payload.install_date)
    if (isNaN(installDate.getTime())) {
      throw new PayloadValidationError(`Invalid Install Date: ${payload.install_date}`)
    }

    const body = buildS2SRequest(payload, deviceType, {
      instDate: formatS2STimestamp(installDate.toISOString()),
      counter: payload.counter,
      // This event cannot precede an install, so the user already exists by definition.
      existingUser: 'true'
    })

    if (payload.deeplink) body.af_deeplink = payload.deeplink

    // The classic destination sends only the query string here, unlike Application Installed
    // which sends the full URL. Reproduced deliberately: this endpoint is undocumented, so
    // we match the bytes that are known to work rather than normalizing the difference.
    if (payload.referrer && deviceType !== 'ios') {
      const query = payload.referrer.includes('?') ? payload.referrer.split('?').slice(1).join('?') : undefined
      if (query) body.referrer = query
    }

    const afSig = generateAfSig(settings.devKey, body.timestamp, body.ip, body.lang)

    return sendS2SEvent(request, settings, appId, body, afSig)
  }
}

export default action
