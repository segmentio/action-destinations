import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'

import type { Settings } from './generated-types'
import { initScript } from './init-script'
import jimo from './jimo'
import { JimoSDK } from './types'

declare global {
  interface Window {
    jimo: JimoSDK
    JIMO_PROJECT_ID: string
    JIMO_MANUAL_INIT: boolean
  }
}

const ENDPOINT_UNDERCITY = 'https://undercity.usejimo.com/jimo-invader.js'

export const destination: BrowserDestinationDefinition<Settings, JimoSDK> = {
  name: 'Jimo',
  slug: 'actions-jimo',
  mode: 'device',

  settings: {
    projectId: {
      description: 'Id of the Jimo project',
      label: 'Id',
      type: 'string',
      required: true
    },
    initOnLoad: {
      label: 'Init on load',
      description: 'Automatically initialize Jimo after loading it on the page',
      type: 'boolean',
      required: false,
      default: true
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript(settings)

    await deps
      .loadScript(`${ENDPOINT_UNDERCITY}`)
      .catch((err) => console.error('Unable to load Jimo SDK script. Error : ', err))

    console.log('Project id : ', window['JIMO_PROJECT_ID'])
    await deps.resolveWhen(
      () => Object.prototype.hasOwnProperty.call(window, 'jimo'),
      // &&
      // // When initialized on load, window.jimo is first an array then become an object after it get initialized
      // settings.initOnLoad === true &&
      // Array.isArray(window.jimo) === false,
      100
    )
    console.log('Jimo added to window')
    return window.jimo
  },
  actions: {
    jimo
  }
}

export default browserDestination(destination)
