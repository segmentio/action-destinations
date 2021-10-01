import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import appboy from '@braze/web-sdk'
import trackEvent from './trackEvent'
import updateUserProfile from './updateUserProfile'
import trackPurchase from './trackPurchase'
import debounce, { resetUserCache } from './debounce'
import { defaultValues, DestinationDefinition } from '@segment/actions-core'

declare global {
  interface Window {
    appboy: typeof appboy
  }
}

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify" or type = "group"',
    partnerAction: 'updateUserProfile',
    mapping: defaultValues(updateUserProfile.fields)
  },
  {
    name: 'Order Completed calls',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'trackPurchase',
    mapping: defaultValues(trackPurchase.fields)
  },
  {
    name: 'Track Calls',
    subscribe: 'type = "track" and event != "Order Completed"',
    partnerAction: 'trackEvent',
    mapping: {
      ...defaultValues(trackEvent.fields),
      eventName: {
        '@path': '$.event'
      },
      eventProperties: {
        '@path': '$.properties'
      }
    }
  }
]

export const destination: BrowserDestinationDefinition<Settings, typeof appboy> = {
  name: 'Braze Web Mode',
  slug: 'actions-braze-web',
  mode: 'device',
  settings: {
    sdkVersion: {
      description: 'The version of the SDK to use. Defaults to 3.3.',
      label: 'SDK Version',
      type: 'string',
      choices: [
        {
          value: '3.3',
          label: '3.3'
        }
      ],
      default: '3.3',
      required: true
    },
    api_key: {
      description: 'Found in the Braze Dashboard under Settings → Manage Settings → Apps → Web',
      label: 'API Key',
      type: 'password',
      required: true
    },
    endpoint: {
      label: 'SDK Endpoint',
      description:
        'Your Braze SDK endpoint. [See more details](https://www.braze.com/docs/user_guide/administrative/access_braze/sdk_endpoints/)',
      type: 'string',
      format: 'uri',
      choices: [
        { label: 'US-01	(https://dashboard-01.braze.com)', value: 'sdk.iad-01.braze.com' },
        { label: 'US-02	(https://dashboard-02.braze.com)', value: 'sdk.iad-02.braze.com' },
        { label: 'US-03	(https://dashboard-03.braze.com)', value: 'sdk.iad-03.braze.com' },
        { label: 'US-04	(https://dashboard-04.braze.com)', value: 'sdk.iad-04.braze.com' },
        { label: 'US-05	(https://dashboard-05.braze.com)', value: 'sdk.iad-05.braze.com' },
        { label: 'US-06	(https://dashboard-06.braze.com)', value: 'sdk.iad-06.braze.com' },
        { label: 'US-08	(https://dashboard-08.braze.com)', value: 'sdk.iad-08.braze.com' },
        { label: 'EU-01	(https://dashboard-01.braze.eu)', value: 'sdk.fra-01.braze.eu' }
      ],
      default: 'sdk.iad-01.braze.com',
      required: true
    },
    allowCrawlerActivity: {
      description:
        'Allow Braze to log activity from crawlers. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)',
      label: 'Allow Crawler Activity',
      default: false,
      type: 'boolean',
      required: false
    },
    allowUserSuppliedJavascript: {
      description:
        'To indicate that you trust the Braze dashboard users to write non-malicious Javascript click actions, set this property to true. If enableHtmlInAppMessages is true, this option will also be set to true. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)',
      label: 'Allow User Supplied Javascript',
      default: false,
      type: 'boolean',
      required: false
    },
    appVersion: {
      description:
        'Version to which user events sent to Braze will be associated with. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)',
      label: 'App Version',
      type: 'string',
      required: false
    },
    contentSecurityNonce: {
      description:
        'Allows Braze to add the nonce to any <script> and <style> elements created by the SDK. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)',
      label: 'Content Security nonce',
      type: 'string',
      required: false
    },
    devicePropertyAllowlist: {
      label: 'Device Property Allow List',
      description:
        'By default, the Braze SDK automatically detects and collects all device properties in DeviceProperties. To override this behavior, provide an array of DeviceProperties. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)',
      type: 'string',
      required: false,
      multiple: true
    },
    disablePushTokenMaintenance: {
      label: 'Disable Push Token Maintenance',
      type: 'boolean',
      default: true,
      required: false,
      description:
        'By default, users who have already granted web push permission will sync their push token with the Braze backend automatically on new session to ensure deliverability. To disable this behavior, set this option to false'
    },
    doNotLoadFontAwesome: {
      label: 'Do Not Load Font Awesome',
      type: 'boolean',
      default: false,
      description:
        'Braze automatically loads FontAwesome 4.7.0 from the FontAwesome CDN. To disable this behavior set this option to true.'
    },
    enableLogging: {
      label: 'Enable Logging',
      required: false,
      default: false,
      type: 'boolean',
      description: 'Set to true to enable logging by default'
    },
    enableSdkAuthentication: {
      label: 'Enable SDK Authentication',
      type: 'boolean',
      required: false,
      default: false,
      description: 'Set to true to enable the SDK Authentication feature.'
    },
    inAppMessageZIndex: {
      label: 'In-App Message Z Index',
      type: 'number',
      required: false,
      description:
        "By default, the Braze SDK will show In-App Messages with a z-index of 1040 for the screen overlay, 1050 for the actual in-app message, and 1060 for the message's close button. Provide a value for this option to override these default z-indexes."
    },
    localization: {
      label: 'Localization',
      type: 'string',
      default: 'en',
      required: false,
      description:
        "By default, any SDK-generated user-visible messages will be displayed in the user's browser language. Provide a value for this option to override that behavior and force a specific language. The value for this option should be a ISO 639-1 Language Code."
    },
    manageServiceWorkerExternally: {
      label: 'Manage Service Worker Externally',
      type: 'boolean',
      default: false,
      required: false,
      description:
        'If you have your own service worker that you register and control the lifecycle of, set this option to true and the Braze SDK will not register or unregister a service worker. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)'
    },
    minimumIntervalBetweenTriggerActionsInSeconds: {
      label: 'Minimum Interval Between Trigger Actions in Seconds',
      type: 'number',
      required: false,
      default: 30,
      description:
        'Provide a value to override the default interval between trigger actions with a value of your own. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)'
    },
    noCookies: {
      label: 'No Cookies',
      type: 'boolean',
      default: false,
      required: false,
      description:
        'By default, the Braze SDK will store small amounts of data (user ids, session ids), in cookies. Pass true for this option to disable cookie storage and rely entirely on HTML 5 localStorage to identify users and sessions. [See more details](https://js.appboycdn.com/web-sdk/latest/doc/modules/appboy.html#initializationoptions)'
    },
    openCardsInNewTab: {
      label: 'Open Cards In New Tab',
      type: 'boolean',
      default: false,
      required: false,
      description:
        'By default, links from Card objects load in the current tab or window. Set this option to true to make links from cards open in a new tab or window.'
    },
    openInAppMessagesInNewTab: {
      label: 'Open In-App Messages In New Tab',
      type: 'boolean',
      default: false,
      required: false,
      description:
        'By default, links from in-app message clicks load in the current tab or a new tab as specified in the dashboard on a message-by-message basis. Set this option to true to force all links from in-app message clicks open in a new tab or window.'
    },
    requireExplicitInAppMessageDismissal: {
      label: 'Require Explicit In-App Message Dismissal',
      type: 'boolean',
      required: false,
      default: false,
      description:
        'By default, when an in-app message is showing, pressing the escape button or a click on the greyed-out background of the page will dismiss the message. Set this option to true to prevent this behavior and require an explicit button click to dismiss messages.'
    },
    safariWebsitePushId: {
      label: 'Safari Website Push ID',
      type: 'string',
      required: false,
      description:
        'If you support Safari push, you must specify this option with the website push ID that you provided to Apple when creating your Safari push certificate (starts with "web", e.g. "web.com.example.domain").'
    },
    serviceWorkerLocation: {
      label: 'Service Worker Location',
      type: 'string',
      required: false,
      description:
        'By default, when registering users for web push notifications Braze will look for the required service worker file in the root directory of your web server at /service-worker.js. If you want to host your service worker at a different path on that server, provide a value for this option that is the absolute path to the file, e.g. /mycustompath/my-worker.js. VERY IMPORTANT: setting a value here limits the scope of push notifications on your site. For instance, in the above example, because the service  ,worker file is located within the /mycustompath/ directory, appboy.registerAppboyPushMessages MAY ONLY BE CALLED from web pages that start with http://yoursite.com/mycustompath/.'
    },
    sessionTimeoutInSeconds: {
      label: 'Session Timeout in Seconds',
      type: 'number',
      default: 1800, // 30 minutes
      required: false,
      description:
        'By default, sessions time out after 30 minutes of inactivity. Provide a value for this configuration option to override that default with a value of your own.'
    }
  },
  initialize: async ({ settings }, dependencies) => {
    const { endpoint, api_key, ...expectedConfig } = settings

    const sdkVersion = settings.sdkVersion?.length ? settings.sdkVersion : '3.3'

    await dependencies.loadScript(`https://js.appboycdn.com/web-sdk/${sdkVersion}/service-worker.js`)

    const initialized = appboy.initialize(settings.api_key, { baseUrl: endpoint, ...expectedConfig })
    if (!initialized) {
      throw new Error('Failed to initialize AppBoy')
    }

    appboy.openSession()
    resetUserCache()

    return appboy
  },
  presets,
  actions: {
    updateUserProfile,
    trackEvent,
    trackPurchase,
    debounce
  }
}

export default browserDestination(destination)
