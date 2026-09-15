import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'
import applicationInstalled from './applicationInstalled'
import applicationOpened from './applicationOpened'

const destination: DestinationDefinition<Settings> = {
  name: 'AppsFlyer (Actions)',
  slug: 'actions-appsflyer',
  mode: 'cloud',
  description: 'Send mobile app events to AppsFlyer for attribution and marketing analytics.',

  authentication: {
    scheme: 'custom',
    fields: {
      s2sToken: {
        label: 'S2S Token',
        description:
          'Your AppsFlyer S2S token, used to authenticate in-app events. Find it in the AppsFlyer dashboard under Account Settings > API tokens. This is not the same as your Dev Key.',
        type: 'password',
        required: true
      },
      devKey: {
        label: 'Dev Key',
        description:
          'Your AppsFlyer Dev Key, found in the AppsFlyer dashboard under App Settings. Used only to sign Application Installed and Application Opened events. Not required if you only send in-app events.',
        type: 'password',
        required: false
      },
      appleAppID: {
        label: 'Apple App ID',
        description: 'Your iOS App ID, without the `id` prefix. Required to send events from iOS devices.',
        type: 'string',
        required: false
      },
      androidAppID: {
        label: 'Android App ID',
        description: 'Your Android package name. Required to send events from Android devices.',
        type: 'string',
        required: false
      },
      rokuAppID: {
        label: 'Roku App ID',
        description: 'Your Roku App ID. Required to send events from Roku devices.',
        type: 'string',
        required: false
      }
    }
    // AppsFlyer's event endpoints are fire-and-forget with no validation endpoint, so there
    // is no way to verify credentials without sending a real event into a customer's app data.
    // `testAuthentication` is intentionally omitted, as it is for the Adjust destination.
  },

  actions: {
    trackEvent,
    applicationInstalled,
    applicationOpened
  }
}

export default destination
