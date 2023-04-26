import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
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
      mapping: defaultValues(setCustomProperties.fields)
    },
    {
      name: 'Set Group Traits as Custom Properties',
      subscribe: 'type = "group"',
      partnerAction: 'setCustomProperties',
      mapping: {
        traits: { '@path': '$.traits' },
        id: { '@path': '$.groupId' },
        idProperty: 'groupId',
        prefix: 'group',
      }
    },
    {
      name: trackEvent.title,
      subscribe: trackEvent.defaultSubscription!,
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: trackGoal.title,
      subscribe: trackGoal.defaultSubscription!,
      partnerAction: 'trackGoal',
      mapping: defaultValues(trackGoal.fields)
    },
    {
      name: trackPage.title,
      subscribe: trackPage.defaultSubscription!,
      partnerAction: 'trackPage',
      mapping: defaultValues(trackPage.fields)
    }
  ],

  settings: {
    websiteId: {
      description:
        "The identifier of your Wisepops' website. You can find it in [your setup code on Wisepops](https://app.wisepops.com/f/settings/websites).",
      label: 'Website Identifier',
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    window.WisePopsObject = 'wisepops'
    window.wisepops =
      window.wisepops ||
      function (...arg) {
        ;(window.wisepops.q = window.wisepops.q || []).push(arg)
      }
    window.wisepops.l = Date.now()
    window.wisepops('options', { autoPageview: false })
    // Can load asynchronously, no need to wait
    void deps.loadScript(`https://loader.wisepops.com/get-loader.js?plugin=segment&v=1&site=${settings.websiteId}`)
    return window.wisepops
  },

  actions: {
    setCustomProperties,
    trackEvent,
    trackGoal,
    trackPage,
  }
}

export default browserDestination(destination)
