import { defaultValues } from '@segment/actions-core'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from './generated-types'
import { initScript } from './init-script'
import sendTrackEvent from './sendTrackEvent'
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
    }
  },
  presets: [
    {
      name: 'Send User Data',
      subscribe: 'type = "identify"',
      partnerAction: 'sendUserData',
      mapping: defaultValues(sendUserData.fields),
      type: 'automatic'
    },
    {
      name: 'Send Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'sendTrackEvent',
      mapping: defaultValues(sendTrackEvent.fields),
      type: 'automatic'
    }
  ],
  initialize: async ({ settings }, deps) => {
    initScript(settings)

    await deps.loadScript(`${ENDPOINT_UNDERCITY}`)

    await deps.resolveWhen(() => Array.isArray(window.jimo) === false, 100)

    return window.jimo as JimoSDK
  },
  actions: {
    sendUserData,
    sendTrackEvent
  }
}

export default browserDestination(destination)
