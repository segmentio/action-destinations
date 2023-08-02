import { LR } from './types'
import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import LogRocket from 'logrocket'
import track from './track'
import identify from './identify'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    LogRocket: LR
    logRocketSettings?: LogRocketSettings
    _LRLogger: () => void
  }

  type LogRocketSettings = NonNullable<Parameters<LR['init']>[1]>
  type RequestSanitizer = NonNullable<LogRocketSettings['network']>['requestSanitizer']
}
// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, LR> = {
  name: 'Logrocket',
  slug: 'actions-logrocket',
  mode: 'device',

  presets: [
    {
      name: 'Track',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    }
  ],

  settings: {
    appID: {
      description: 'The LogRocket app ID.',
      label: 'LogRocket App',
      type: 'string',
      required: true
    },
    networkSanitization: {
      description: 'Sanitize all network request and response bodies from session recordings.',
      label: 'Network Sanitization',
      type: 'boolean',
      required: true,
      default: true
    },
    inputSanitization: {
      description: 'Obfuscate all user-input elements (like <input> and <select>) from session recordings.',
      label: 'Input Sanitization',
      type: 'boolean',
      required: true,
      default: true
    }
  },

  initialize: async ({ settings: { appID, inputSanitization: inputSanitizer, networkSanitization } }, deps) => {
    const requestSanitizer: RequestSanitizer = (request) => {
      if (networkSanitization) {
        request.body = undefined
        request.headers = {}
      }

      return request
    }
    const settings: LogRocketSettings = {
      dom: {
        inputSanitizer
      },
      network: {
        requestSanitizer,
        responseSanitizer: requestSanitizer
      }
    }
    LogRocket.init(appID, window.logRocketSettings || settings)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, '_LRLogger'), 100)
    return LogRocket
  },

  actions: {
    track,
    identify
  }
}

export default browserDestination(destination)
