import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { HeapApi, HeapMethods, UserConfig } from './types'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import { initScript } from './init-script'
import { isDefined } from './utils'

declare global {
  interface Window {
    heapReadyCb: Array<{ name: HeapMethods; fn: () => void }>
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
        'Setting to true will redact all target text on your website. For more information visit the Heap [docs page](https://developers.heap.io/docs/web#global-data-redaction-via-disabling-text-capture).',
      type: 'boolean',
      required: false
    },
    secureCookie: {
      label: 'Secure Cookie',
      description:
        'This option is turned off by default to accommodate websites not served over HTTPS. If your application uses HTTPS, we recommend enabling secure cookies to prevent Heap cookies from being observed by unauthorized parties. For more information visit the Heap [docs page](https://developers.heap.io/docs/web#securecookie).',
      type: 'boolean',
      required: false
    },
    trackingServer: {
      label: 'Tracking Server (deprecated)',
      description:
        'This is an optional setting. This is used to set up first-party data collection. For most cased this should not be set. For more information visit the Heap [docs page](https://developers.heap.io/docs/set-up-first-party-data-collection-in-heap). This field is deprecated in favor of `ingestServer`. If `trackingServer` is set and `ingestServer` is not set, then the Classic SDK will be loaded. If both are set, `ingestServer` will take precedence, and the latest stable version of the Heap SDK will be loaded.',
      type: 'string',
      required: false
    },
    ingestServer: {
      label: 'Ingest Server',
      description:
        'This is an optional setting. This is used to set up first-party data collection. For most cased this should not be set. For more information visit the Heap [docs page](https://developers.heap.io/docs/web#ingestserver).',
      type: 'string',
      required: false
    },
    hostname: {
      label: 'Hostname',
      description:
        'This is an optional setting used to set the host that loads the Heap SDK. This setting is used when the Heap SDK is self-hosted. In most cased this should be left unset. The hostname should not contain https or app id. When _both_ `hostname` and `trackingServer` are set, the Classic SDK will be loaded via: `https://${hostname}/js/heap-${appId}.js`. If `hostname` is set and `trackingServer` is not set, then the latest version of the Heap SDK will be loaded via: `https://${settings.hostname}/config/${settings.appId}/heap_config.js`. For more information visit the Heap [docs page](https://developers.heap.io/docs/self-hosting-heapjs).',
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
      secureCookie: settings.secureCookie || false,
      ...(settings.ingestServer && { ingestServer: settings.ingestServer }),
      // For backward compatibility. See https://developers.heap.io/docs/web#ingestserver
      ...(settings.trackingServer && { trackingServer: settings.trackingServer })
    }

    initScript(settings.appId, config)

    // if both hostname and trackingServer are set, load classic SDK from hostname
    if (isDefined(settings.hostname) && isDefined(settings.trackingServer)) {
      await deps.loadScript(`https://${settings.hostname}/js/heap-${settings.appId}.js`)
    }
    // if only hostname is set, load latest version of SDK from hostname
    else if (isDefined(settings.hostname) && !isDefined(settings.trackingServer)) {
      await deps.loadScript(`https://${settings.hostname}/config/${settings.appId}/heap_config.js`)
    }
    // default to loading latest version of SDK from heap CDN
    else {
      await deps.loadScript(`https://cdn.us.heap-api.com/config/${settings.appId}/heap_config.js`)
    }

    // Explained here: https://stackoverflow.com/questions/14859058/why-does-the-segment-io-loader-script-push-method-names-args-onto-a-queue-which
    await deps.resolveWhen(() => window.heap.loaded === true, 300)

    return window.heap
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
