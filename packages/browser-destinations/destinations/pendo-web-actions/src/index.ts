import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { loadPendo } from './loadScript'
import { PendoOptions, PendoSDK } from './types'
import { ID } from '@segment/analytics-next'
import { defaultValues } from '@segment/actions-core'

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
      description: 'The region for your Pendo subscription.',
      required: true,
      default: 'https://cdn.pendo.io',
      choices: [
        { value: 'https://cdn.pendo.io', label: 'US (default)' },
        { value: 'https://cdn.eu.pendo.io', label: 'EU' },
        { value: 'https://us1.cdn.pendo.io', label: 'US restricted' },
        { value: 'https://cdn.jpn.pendo.io', label: 'Japan' }
      ]
    },
    cnameContentHost: {
      label: 'Optional CNAME content host',
      description:
        "If you are using Pendo's CNAME feature, this will update your Pendo install snippet with your content host.",
      type: 'string',
      required: false
    },
    disableUserTraitsOnLoad: {
      label: "Disable passing Segment's user traits to Pendo on start up",
      description:
        "Override sending Segment's user traits on load. This will prevent Pendo from initializing with the user traits from Segment (analytics.user().traits()). Allowing you to adjust the mapping of visitor metadata in Segment's identify event.",
      type: 'boolean',
      required: false,
      default: false
    },
    disableGroupIdAndTraitsOnLoad: {
      label: "Disable passing Segment's group id and group traits to Pendo on start up",
      description:
        "Override sending Segment's group id for Pendo's account id. This will prevent Pendo from initializing with the group id from Segment (analytics.group().id()). Allowing you to adjust the mapping of account id in Segment's group event.",
      type: 'boolean',
      required: false,
      default: false
    }
  },

  initialize: async ({ settings, analytics }, deps) => {
    if (settings.cnameContentHost && !/^https?:/.exec(settings.cnameContentHost) && settings.cnameContentHost.length) {
      settings.cnameContentHost = 'https://' + settings.cnameContentHost
    }

    loadPendo(settings.apiKey, settings.region, settings.cnameContentHost)

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
        ...(!settings.disableUserTraitsOnLoad ? analytics.user().traits() : {}),
        id: visitorId
      },
      ...(accountId && !settings.disableGroupIdAndTraitsOnLoad
        ? {
            account: {
              ...analytics.group().traits(),
              id: accountId
            }
          }
        : {})
    }

    window.pendo.initialize(options)

    return window.pendo
  },
  actions: {
    track,
    identify,
    group
  },
  presets: [
    {
      name: 'Send Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Send Identify Event',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Send Group Event',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    }
  ]
}

export default browserDestination(destination)
