import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import type { UserMotion } from './types'

import { browserDestination } from '@segment/browser-destination-runtime/shim'

import identify from './identify'
import { defaultValues } from '@segment/actions-core'

import group from './group'

import track from './track'

import pageview from './pageview'

declare global {
  interface Window {
    usermotion: UserMotion
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, UserMotion> = {
  name: 'UserMotion (Actions)',
  slug: 'actions-usermotion-web',
  mode: 'device',
  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Page View',
      subscribe: 'type = "page"',
      partnerAction: 'pageview',
      mapping: defaultValues(pageview.fields),
      type: 'automatic'
    }
  ],
  settings: {
    apiKey: {
      label: 'Api Key',
      description: 'Your UserMotion Api Key',
      required: true,
      type: 'string'
    }
  },
  initialize: async ({ settings }, deps) => {
    await deps.loadScript(`//api.usermotion.com/js/${settings.apiKey}.js}`)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'usermotion'), 100)

    return window.usermotion
  },

  actions: {
    identify,
    group,
    track,
    pageview
  }
}

export default browserDestination(destination)
