import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Wisepops } from './types'

import { defaultValues } from '@segment/actions-core'

import setCustomProperties from './setCustomProperties'
import trackEvent from './trackEvent'
import trackGoal from './trackGoal'
import trackPage from './trackPage'

declare global {
  interface Window {
    wisepops: Wisepops
    WisePopsObject: string
  }
}

export const destination: BrowserDestinationDefinition<Settings, Wisepops> = {
  name: 'Wisepops',
  slug: 'actions-wisepops',
  mode: 'device',

  presets: [
    {
      name: 'Set User Traits as Custom Properties',
      subscribe: setCustomProperties.defaultSubscription!,
      partnerAction: 'setCustomProperties',
      mapping: defaultValues(setCustomProperties.fields),
      type: 'automatic'
    },
    {
      name: 'Set Group Traits as Custom Properties',
      subscribe: 'type = "group"',
      partnerAction: 'setCustomProperties',
      mapping: {
        traits: { '@path': '$.traits' },
        id: { '@path': '$.groupId' },
        idProperty: 'groupId',
        prefix: 'group'
      },
      type: 'automatic'
    },
    {
      name: trackEvent.title,
      subscribe: trackEvent.defaultSubscription!,
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: trackGoal.title,
      subscribe: trackGoal.defaultSubscription!,
      partnerAction: 'trackGoal',
      mapping: defaultValues(trackGoal.fields),
      type: 'automatic'
    },
    {
      name: trackPage.title,
      subscribe: trackPage.defaultSubscription!,
      partnerAction: 'trackPage',
      mapping: defaultValues(trackPage.fields),
      type: 'automatic'
    }
  ],

  settings: {
    websiteId: {
      description:
        "The identifier of your Wisepops' website. You can find it in [your setup code on Wisepops](https://id.wisepops.com/r/id/workspaces/_workspaceId_/settings/setup-code).",
      label: 'Website Identifier',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    window.wisepops =
      window.wisepops ||
      function (...args) {
        ;(window.wisepops.q = window.wisepops.q || []).push(args)
      }
    window.wisepops.l = Date.now()
    window.wisepops('options', { autoPageview: false })
    // Can load asynchronously, no need to wait
    void deps.loadScript(`https://wisepops.net/loader.js?plugin=segment&v=2&h=${settings.websiteId}`)
    return window.wisepops
  },

  actions: {
    setCustomProperties,
    trackEvent,
    trackGoal,
    trackPage
  }
}

export default browserDestination(destination)
