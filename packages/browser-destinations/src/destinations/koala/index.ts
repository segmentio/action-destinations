import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import type { KoalaSDK } from './types'
import { defaultValues } from '@segment/actions-core'
import { browserDestination } from '../../runtime/shim'
import { initScript } from './init-script'
import trackEvent from './trackEvent'
import identifyVisitor from './identifyVisitor'

declare global {
  interface Window {
    ko: KoalaSDK
  }
}

export const destination: BrowserDestinationDefinition<Settings, KoalaSDK> = {
  name: 'Koala',
  slug: 'actions-koala',
  description: 'Connect Koala in Segment to send visitor events or traits to Koala.',
  mode: 'device',
  settings: {
    project_slug: {
      type: 'string',
      label: 'Koala Project Slug',
      description: "Please enter your project's slug found in your Koala project settings.",
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript()
    await deps.loadScript(`https://cdn.koala.live/v1/${settings.project_slug}/sdk.js`)
    return window.ko
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
