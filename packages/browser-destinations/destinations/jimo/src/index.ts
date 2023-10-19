import { defaultValues } from '@segment/actions-core'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from './generated-types'
import { initScript } from './init-script'
import sendUserData from './sendUserData'
import { JimoSDK } from './types'

declare global {
  interface Window {
    jimo: JimoSDK | never[]
    JIMO_PROJECT_ID: string
    JIMO_MANUAL_INIT: boolean
  }
}

const ENDPOINT_UNDERCITY = 'https://undercity.usejimo.com/jimo-invader.js'

export const destination: BrowserDestinationDefinition<Settings, JimoSDK> = {
  name: 'Jimo (Actions)',
  slug: 'actions-jimo',
  mode: 'device',
  description: 'Load Jimo SDK and send user profile data to Jimo',

  settings: {
    projectId: {
      description:
        'Id of the Jimo project. You can find the Project Id here: https://i.usejimo.com/settings/install/portal',
      label: 'Id',
      type: 'string',
      required: true
    },
    manualInit: {
      label: 'Initialize Jimo manually',
      description:
        'Toggling to true will prevent Jimo from initializing automatically. For more information, check out: https://help.usejimo.com/knowledge-base/for-developers/sdk-guides/manual-initialization',
      type: 'boolean',
      required: false,
      default: false
    }
  },
  presets: [
    {
      name: 'Send User Data',
      subscribe: 'type = "identify"',
      partnerAction: 'sendUserData',
      mapping: defaultValues(sendUserData.fields),
      type: 'automatic'
    }
  ],
  initialize: async ({ settings }, deps) => {
    initScript(settings)

    await deps.loadScript(`${ENDPOINT_UNDERCITY}`)

    return window.jimo as JimoSDK
  },
  actions: {
    sendUserData
  }
}

export default browserDestination(destination)
