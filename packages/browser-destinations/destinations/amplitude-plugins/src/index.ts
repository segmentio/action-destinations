import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import sessionId from './sessionId'
import autocaptureAttribution from './autocaptureAttribution'

export const destination: BrowserDestinationDefinition<Settings, {}> = {
  name: 'Amplitude (Actions)',
  mode: 'device',
  actions: {
    sessionId,
    autocaptureAttribution
  },
  initialize: async () => {
    return {}
  }
}

export default browserDestination(destination)
