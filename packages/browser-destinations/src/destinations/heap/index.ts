import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'

import { HeapApi } from './types'

declare global {
  interface Window {
    heap: HeapApi
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, HeapApi> = {
  name: 'Heap',
  slug: 'heap',
  mode: 'device',

  settings: {
    // Add any Segment destination settings required here
    appId: {
      label: 'Heap app ID',
      description:
        'The app ID of the environment to which you want to send data. You can find this ID on the [Projects](https://heapanalytics.com/app/manage/projects) page.',
      type: 'string',
      required: true
    },
    disableTextCapture: {
      label: 'Global data redaction via Disabling Text Capture',
      description:
        'Setting to true will redact all target text on your website. For more information visit the heap [docs page](https://developers.heap.io/docs/web#global-data-redaction-via-disabling-text-capture).',
      type: 'boolean',
      required: false
    },
    secureCookie: {
      label: 'Secure Cookie',
      description:
        'This option is turned off by default to accommodate websites not served over HTTPS. If your application uses HTTPS, we recommend enabling secure cookies to prevent Heap cookies from being observed by unauthorized parties. For more information visit the heap [docs page](https://developers.heap.io/docs/web#securecookie).',
      type: 'boolean',
      required: false
    }
  },

  initialize: async ({ settings }, deps) => {
    const config = {
      disableTextCapture: settings.disableTextCapture || false,
      secureCookie: settings.secureCookie || false
    }

    await deps.loadScript(`https://cdn.heapanalytics.com/js/heap-${settings.appId}.js`)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'heap'), 100)
    window.heap.config = config

    return window.heap
  },

  actions: {}
}

export default browserDestination(destination)
