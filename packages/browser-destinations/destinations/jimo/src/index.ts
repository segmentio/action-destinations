import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'

import type { Settings } from './generated-types'
import { initScript } from './init-script'
import { JimoSDK } from './types'

import sendUserData from './sendUserData'

declare global {
  interface Window {
    jimo: JimoSDK | never[]
    JIMO_PROJECT_ID: string
    JIMO_MANUAL_INIT: boolean
  }
}

const ENDPOINT_UNDERCITY = 'https://undercity.usejimo.com/jimo-invader.js'

export const destination: BrowserDestinationDefinition<Settings, JimoSDK> = {
  name: 'Jimo',
  slug: 'actions-jimo',
  mode: 'device',
  description: 'Install Jimo through with segment',

  settings: {
    projectId: {
      description: 'Id of the Jimo project. You can find it here: https://i.usejimo.com/settings/install/portal',
      label: 'Id',
      type: 'string',
      required: true
    },
    manualInit: {
      label: 'Initialize Jimo manually',
      description:
        'Make sure Jimo is not initialized automatically after being added to your website. For more information, check out: https://help.usejimo.com/knowledge-base/for-developers/sdk-guides/manual-initialization',
      type: 'boolean',
      required: false,
      default: false
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript(settings)

    try {
      await deps.loadScript(`${ENDPOINT_UNDERCITY}`)
    } catch (err) {
      console.error('Unable to load Jimo SDK script. Error : ', err)
      throw new Error('JIMO_LOAD_SCRIPT_FAILED')
    }

    await deps.resolveWhen(
      () =>
        Object.prototype.hasOwnProperty.call(window, 'jimo') &&
        // When initialized on load, window.jimo is first an array then become an object after it get initialized
        settings.manualInit === false &&
        Array.isArray(window.jimo) === false,
      100
    )
    return window.jimo as JimoSDK
  },
  actions: {
    sendUserData
  }
}

export default browserDestination(destination)
