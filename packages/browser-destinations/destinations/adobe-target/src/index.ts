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
      label: 'ATJS Version',
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

    const targetUrl = 'testandtarget.omniture.com/admin/rest/v1/libraries/atjs/download'
    const atjsUrl = `https://admin${settings.admin_number}.${targetUrl}?client=${settings.client_code}&version=${settings.version}`

    await deps.loadScript(atjsUrl)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'adobe'), 100)
    return window.adobe
  },

  actions: {
    upsertProfile,
    triggerView,
    trackEvent
  }
}

export default browserDestination(destination)
