import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { Screeb } from './types'
import { defaultValues } from '@segment/actions-core'
import identify from './identify'
import track from './track'
import group from './group'
import alias from './alias'

declare global {
  interface Window {
    $screeb: Screeb
  }
}

export const destination: BrowserDestinationDefinition<Settings, Screeb> = {
  name: 'Screeb Web (Actions)',
  slug: 'actions-screeb-web',
  mode: 'device',

  settings: {
    websiteId: {
      description: 'Your website ID (given in Screeb app).',
      label: 'Website ID',
      type: 'string',
      required: true
    }
  },

  presets: [
    {
      name: 'Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Track',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    },
    {
      name: 'Alias',
      subscribe: 'type = "alias"',
      partnerAction: 'alias',
      mapping: defaultValues(alias.fields),
      type: 'automatic'
    }
  ],

  initialize: async ({ settings }, deps) => {
    const preloadFunction = function (...args: unknown[]) {
      if (window.$screeb.q) {
        window.$screeb.q.push(args)
      }
    }
    window.$screeb = preloadFunction
    window.$screeb.q = []

    await deps.loadScript('https://t.screeb.app/tag.js')
    await deps.resolveWhen(() => window.$screeb !== preloadFunction, 500)

    window.$screeb('init', settings.websiteId)

    return window.$screeb
  },

  actions: {
    identify,
    track,
    group,
    alias
  }
}

export default browserDestination(destination)
