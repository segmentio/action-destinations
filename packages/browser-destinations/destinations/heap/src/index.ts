import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { HeapApi, UserConfig } from './types'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import { isDefined } from './utils'

declare global {
  interface Window {
    heap: HeapApi
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, HeapApi> = {
  name: 'Heap Web (Actions)',
  slug: 'actions-heap-web',
  mode: 'device',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ],
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
    },
    trackingServer: {
      label: 'Tracking Server',
      description:
        'This is an optional setting. This is used to set up first-party data collection. For most cased this should not be set. For more information visit the heap [docs page](https://developers.heap.io/docs/set-up-first-party-data-collection-in-heap).',
      type: 'string',
      required: false
    },
    hostname: {
      label: 'Hostname',
      description:
        'This is an optional setting used to set the host that loads heap-js. This setting is used when heapJS is self-hosted. In most cased this should be left unset. The hostname should not contain https or app id it will be populated like so: https://${hostname}/js/heap-${appId}.js. For more information visit the heap [docs page](https://developers.heap.io/docs/self-hosting-heapjs).',
      type: 'string',
      required: false
    },
    browserArrayLimit: {
      label: 'Browser Array Limit',
      description:
        'This is an optional setting. When set, nested array items will be sent in as new Heap events. Defaults to 0.',
      type: 'number',
      required: false
    }
  },

  initialize: async ({ settings }, deps) => {
    if (window.heap) {
      return window.heap
    }

    const config: UserConfig = {
      disableTextCapture: settings.disableTextCapture || false,
      secureCookie: settings.secureCookie || false
    }

    if (settings.trackingServer) {
      config.trackingServer = settings.trackingServer
    }

    // heap.appid and heap.config must be set before loading heap.js.
    window.heap = window.heap || []
    window.heap.appid = settings.appId
    window.heap.config = config

    if (isDefined(settings.hostname)) {
      await deps.loadScript(`https://${settings.hostname}/js/heap-${settings.appId}.js`)
    } else {
      await deps.loadScript(`https://cdn.heapanalytics.com/js/heap-${settings.appId}.js`)
    }

    // Explained here: https://stackoverflow.com/questions/14859058/why-does-the-segment-io-loader-script-push-method-names-args-onto-a-queue-which
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'heap'), 100)

    return window.heap
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
