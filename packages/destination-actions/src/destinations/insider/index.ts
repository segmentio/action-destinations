import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import updateUserProfile from './updateUserProfile'
import trackEvent from './trackEvent'
import { defaultValues } from '@segment/actions-core'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'updateUserProfile',
    mapping: defaultValues(updateUserProfile.fields)
  },
  {
    name: 'Track Calls',
    subscribe:
      'type = "track" and event != "Order Completed" and event != "Cart Viewed" and event != "Checkout Viewed"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Insider Cloud Mode (Actions)',
  slug: 'actions-insider-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      account_name: {
        label: 'Account Name',
        description:
          'You can get your Account Name via Insider Inone Panel > Settings > Inone Settings > Account Preferences.',
        type: 'string',
        required: true
      },
      ucd_key: {
        label: 'API Key',
        description: 'You can get your API Key via Insider Inone Panel > Settings > Preferences > Integration Settings',
        type: 'password',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { 'X-PARTNER-NAME': settings.account_name, 'X-REQUEST-TOKEN': settings.ucd_key }
    }
  },

  presets,
  actions: {
    updateUserProfile,
    trackEvent
  }
}

export default destination
