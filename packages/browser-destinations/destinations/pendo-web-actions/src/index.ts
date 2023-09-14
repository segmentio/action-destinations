import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { loadPendo } from './loadScript'
import { InitializeData, PendoSDK } from './types'

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
    accountId: {
      label: 'Set Pendo Account ID on Load',
      description:
        'Segment can set the Pendo Account ID upon page load. This can be overridden via the Account ID field in the Send Identify/Group Actions',
      type: 'string',
      required: false
    },
    parentAccountId: {
      label: 'Set Pendo Parent Account ID on Load',
      description:
        'Segment can set the Pendo Parent Account ID upon page load. This can be overridden via the Parent Account ID field in the Send Identify/Group Actions. Note: Contact Pendo to request enablement of Parent Account feature.',
      type: 'string',
      required: false
    },
    region: {
      label: 'Region',
      type: 'string',
      description: "The Pendo Region you'd like to send data to",
      required: true,
      default: 'io',
      choices: [
        { value: 'io', label: 'io' },
        { value: 'eu', label: 'eu' }
      ]
    },
    setVisitorIdOnLoad: {
      label: 'Set Vistor ID on Load',
      description:
        'Segment can set the Pendo Visitor ID upon page load to either the Segment userId or anonymousId. This can be overridden via the Visitor ID field in the Send Identify/Group Actions',
      type: 'string',
      default: 'disabled',
      choices: [
        { value: 'disabled', label: 'Do not set Visitor ID on load' },
        { value: 'userIdOnly', label: 'Set Visitor ID to userId on load' },
        { value: 'userIdOrAnonymousId', label: 'Set Visitor ID to userId or anonymousId on load' },
        { value: 'anonymousIdOnly', label: 'Set Visitor ID to anonymousId on load' }
      ],
      required: true
    }
  },

  initialize: async ({ settings, analytics }, deps) => {
    loadPendo(settings.apiKey, settings.region)

    await deps.resolveWhen(() => window.pendo != null, 100)

    const initialData: InitializeData = {}

    if (settings.setVisitorIdOnLoad) {
      let vistorId: string | null = null

      switch (settings.setVisitorIdOnLoad) {
        case 'disabled':
          vistorId = null
          break
        case 'userIdOnly':
          vistorId = analytics.user().id() ?? null
          break
        case 'userIdOrAnonymousId':
          vistorId = analytics.user().id() ?? analytics.user().anonymousId() ?? null
          break
        case 'anonymousIdOnly':
          vistorId = analytics.user().anonymousId() ?? null
          break
      }

      if (vistorId) {
        initialData.visitor = {
          id: vistorId
        }
      }
    }
    if (settings.accountId) {
      initialData.account = {
        id: settings.accountId
      }
    }
    if (settings.parentAccountId) {
      initialData.parentAccount = {
        id: settings.parentAccountId
      }
    }

    window.pendo.initialize(initialData)

    return window.pendo
  },
  actions: {
    track,
    identify,
    group
  }
}

export default browserDestination(destination)
