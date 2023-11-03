import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { initScript } from './init-script'
import { CommandBarClientSDK } from './types'

import identifyUser from './identifyUser'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'

declare global {
  interface Window {
    CommandBar: CommandBarClientSDK
  }
}

export const destination: BrowserDestinationDefinition<Settings, CommandBarClientSDK> = {
  name: 'CommandBar',
  slug: 'actions-commandbar',
  mode: 'device',

  settings: {
    orgId: {
      description: 'The ID of your CommandBar organization.',
      label: 'Organization ID',
      type: 'string',
      required: true
    },
    deploy: {
      description:
        'If enabled, CommandBar will be deployed to your site automatically and you can remove the snippet from your source code.',
      label: 'Deploy via Segment',
      type: 'boolean',
      required: false
    }
  },

  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ],

  initialize: async ({ settings }, deps) => {
    if (!window.CommandBar) {
      initScript(settings.orgId)
    }

    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'CommandBar'), 100)

    // Older CommandBar snippets initialize a proxy that traps all field access including `then`
    // `then` is called implicitly on the return value of an async function on await
    // So, we need to remove that behavior for the promise to resolve
    Object.assign(window.CommandBar, { then: undefined })

    return window.CommandBar
  },

  actions: {
    identifyUser,
    trackEvent
  }
}

export default browserDestination(destination)
