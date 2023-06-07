import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { KoalaSDK, Koala } from './types'
import { defaultValues } from '@segment/actions-core'
import { browserDestination } from '../../runtime/shim'
import { initScript } from './init-script'
import trackEvent from './trackEvent'
import identifyVisitor from './identifyVisitor'

declare global {
  interface Window {
    ko: Koala
    KoalaSDK: KoalaSDK
  }
}

export const destination: BrowserDestinationDefinition<Settings, Koala> = {
  name: 'Koala',
  slug: 'actions-koala',
  description: 'Connect Koala in Segment to send visitor events or traits to Koala.',
  mode: 'device',
  settings: {
    project_slug: {
      type: 'string',
      label: 'Public API Key',
      description: 'Please enter your Public API Key found in your Koala workspace settings.',
      required: true
    }
  },

  initialize: async ({ settings, analytics }, deps) => {
    initScript()
    await deps.loadScript(`https://cdn.koala.live/v1/${settings.project_slug}/umd.js`)

    const ko = await window.KoalaSDK.load({
      project: settings.project_slug,
      hookSegment: false
    })

    void analytics.ready(() => ko.ready(() => ko.identify(analytics.user().traits() as Record<string, unknown>)))

    return ko
  },

  actions: {
    trackEvent,
    identifyVisitor
  },

  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Identify Visitor',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyVisitor',
      mapping: defaultValues(identifyVisitor.fields)
    }
  ]
}

export default browserDestination(destination)
