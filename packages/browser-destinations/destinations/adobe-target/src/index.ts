import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { Adobe } from './types'
import { initScript } from './init-script'

import upsertProfile from './upsertProfile'
import triggerView from './triggerView'
import trackEvent from './trackEvent'

declare global {
  interface Window {
    adobe: Adobe
    targetPageParams: Function
    pageParams: Object
  }
}

// Times to check for the at.js library
// 2 seconds limit. Fail-safe afterward.
const MAX_RETRY = 4

// Time delay between at.js library load
const LIBRARY_LOAD_DELAY = 500

export const destination: BrowserDestinationDefinition<Settings, Adobe> = {
  name: 'Adobe Target Web',
  slug: 'actions-adobe-target-web',
  mode: 'device',

  settings: {
    client_code: {
      label: 'Client Code',
      description:
        'Your Adobe Target client code. To find your client code in Adobe Target, navigate to **Administration > Implementation**. The client code is shown at the top under Account Details.',
      required: true,
      type: 'string'
    },
    admin_number: {
      label: 'Admin number',
      description:
        'Your Adobe Target admin number. To find your admin number, please follow the instructions in [Adobe Docs](https://experienceleague.adobe.com/docs/target/using/implement-target/client-side/at-js-implementation/deploy-at-js/implementing-target-without-a-tag-manager.html).',
      required: true,
      type: 'string'
    },
    version: {
      label: 'ATJS Version', // Ignored when at.js library is self-hosted.
      description: 'The version of ATJS to use. Defaults to 2.8.0.',
      type: 'string',
      choices: [
        {
          value: '2.8.0',
          label: '2.8.0'
        }
      ],
      default: '2.8.0',
      required: true
    },
    mbox_name: {
      label: 'Mbox Name',
      description: 'The name of the Adobe Target mbox to use. Defaults to `target-global-mbox`.',
      type: 'string',
      required: true,
      default: 'target-global-mbox'
    },
    cookie_domain: {
      label: 'Cookie Domain',
      description:
        "The domain from which you serve the mbox. Adobe Target recommends setting this value to your company's top-level domain.",
      type: 'string',
      required: true
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript(settings)
    let dependencyCheckLimit = MAX_RETRY

    await deps.resolveWhen(() => {
      dependencyCheckLimit--

      // If at.js library is never loaded fail silently.
      // Don't throw exception as throwing can result in a noisy destination.
      // Return true to stop the eventListener from hanging.
      if (!dependencyCheckLimit) {
        return true
      }

      return Object.prototype.hasOwnProperty.call(window, 'adobe')
    }, LIBRARY_LOAD_DELAY)

    return window.adobe || {}
  },

  actions: {
    upsertProfile,
    triggerView,
    trackEvent
  }
}

export default browserDestination(destination)
