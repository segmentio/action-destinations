import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { Adobe } from './types'
import { initScript } from './init-script'

import upsertProfile from './upsertProfile'

declare global {
  interface Window {
    adobe: Adobe
  }
}

export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Adobe Target Web',
  slug: 'actions-adobe-target-web',
  mode: 'device',

  settings: {
    client_code: {
      label: 'Client Code',
      description:
        'Your client code is available at the top of the Administration > Implementation page of the Target interface.',
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
      label: 'MBox Name',
      description: 'The name of the mbox to use',
      type: 'string',
      required: true,
      default: 'target-global-mbox'
    },
    cookie_domain: {
      label: 'Cookie Domain',
      description: 'The domain of the platform that your integration will run on',
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
    upsertProfile
  }
}

export default browserDestination(destination)
