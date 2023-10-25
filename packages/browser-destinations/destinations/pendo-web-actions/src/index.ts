import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { loadPendo } from './loadScript'
import { PendoOptions, PendoSDK } from './types'
import { ID } from '@segment/analytics-next'

import identify from './identify'
import track from './track'
import group from './group'

declare global {
  interface Window {
    pendo: PendoSDK
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, PendoSDK> = {
  name: 'Pendo Web (actions)',
  slug: 'actions-pendo-web',
  mode: 'device',
  description:
    'Send analytics events, User profile data and Account data to Pendo via Segment track(), identify() and group() events on your browser',
  settings: {
    apiKey: {
      label: 'Pendo API Key',
      description: 'Pendo API Key',
      type: 'string',
      required: true
    },
    region: {
      label: 'Region',
      type: 'string',
      description:
        'The region for your Pendo subscription.  If you access Pendo at https://us1.app.pendo.io/ then choose us-only.',
      required: true,
      default: 'https://cdn.pendo.io',
      choices: [
        { value: 'https://cdn.pendo.io', label: 'io' },
        { value: 'https://cdn.eu.pendo.io', label: 'eu' },
        { value: 'https://us1.cdn.pendo.io', label: 'us-only' }
      ]
    }
  },

  initialize: async ({ settings, analytics }, deps) => {
    loadPendo(settings.apiKey, settings.region)

    await deps.resolveWhen(() => window.pendo != null, 100)

    let visitorId: ID = null
    let accountId: ID = null

    if (analytics.user().id()) {
      visitorId = analytics.user().id()
    } else if (analytics.user().anonymousId()) {
      // Append Pendo anonymous visitor tag
      // https://github.com/segmentio/analytics.js-integrations/blob/master/integrations/pendo/lib/index.js#L114
      visitorId = '_PENDO_T_' + analytics.user().anonymousId()
    }

    if (analytics.group().id()) {
      accountId = analytics.group().id()
    }

    const options: PendoOptions = {
      visitor: {
        ...analytics.user().traits(),
        id: visitorId
      },
      ...(accountId
        ? {
            account: {
              ...analytics.group().traits(),
              id: accountId
            }
          }
        : {})
    }

    // If parentAccount exists in group traits, lift it out of account properties into options properties
    // https://github.com/segmentio/analytics.js-integrations/blob/master/integrations/pendo/lib/index.js#L136
    if (options.account?.parentAccount) {
      options.parentAccount = options.account.parentAccount
      delete options.account.parentAccount
    }

    window.pendo.initialize(options)

    return window.pendo
  },
  actions: {
    track,
    identify,
    group
  }
}

export default browserDestination(destination)
