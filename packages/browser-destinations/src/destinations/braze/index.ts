import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import appboy from '@braze/web-sdk'
import logCustomEvent from './logCustomEvent'
import logUser from './logUser'
import logPurchase from './logPurchase'

declare global {
  interface Window {
    appboy: typeof appboy
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, typeof appboy> = {
  name: 'Braze Web Mode',
  slug: 'actions-braze-web',
  mode: 'device',
  settings: {
    api_key: {
      description: 'Created under Developer Console in the Braze Dashboard.',
      label: 'API Key',
      type: 'string',
      required: true
    },
    endpoint: {
      description: 'Your Braze SDK endpoint. [See more details](https://www.braze.com/docs/api/basics/#endpoints).',
      label: 'SDK Endpoint',
      type: 'string',
      format: 'uri',
      required: true
    }
  },

  initialize: async ({ settings }, dependencies) => {
    // default options set at the legacy appboy destination
    // not sure if this is needed yet
    const config: appboy.InitializationOptions = {
      safariWebsitePushId: '',
      allowCrawlerActivity: false,
      doNotLoadFontAwesome: false,
      enableLogging: false,
      localization: 'en',
      minimumIntervalBetweenTriggerActionsInSeconds: 30,
      openInAppMessagesInNewTab: false,
      sessionTimeoutInSeconds: 30,
      requireExplicitInAppMessageDismissal: false,
      enableHtmlInAppMessages: false,
      // openNewsFeedCardsInNewTab: false,
      // automaticallyDisplayMessages: true,
      // trackAllPages: false,
      // trackNamedPages: false,
      // customEndpoint: '',
      // changed from 1 to 3
      // version: 3,
      // logPurchaseWhenRevenuePresent: false,
      // onlyTrackKnownUsersOnWeb: false,
      baseUrl: settings.endpoint
    }

    await dependencies.loadScript('https://js.appboycdn.com/web-sdk/3.3/service-worker.js')

    const initialized = appboy.initialize(settings.api_key, config)
    if (!initialized) {
      throw new Error('Failed to initialize AppBoy')
    }

    appboy.openSession()
    return appboy
  },

  actions: {
    logUser,
    logCustomEvent,
    logPurchase
  }
}

export default browserDestination(destination)
