import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import trackEvent from './trackEvent'
import { initializeSDK } from './functions'

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, unknown> = {
  name: 'Moengage Web',
  slug: 'actions-moengage-web',
  mode: 'device',

  settings: {
    app_id: {
      description: 'Your Moengage Workspace ID.',
      label: 'Workspace ID',
      type: 'string',
      format: 'password',
      required: true
    },
    env: {
      description: 'The environment for your Moengage account.',
      label: 'Environment',
      type: 'string',
      required: true,
      default: 'LIVE',
      choices: [
        { label: 'LIVE', value: 'LIVE' },
        { label: 'TEST', value: 'TEST' }
      ]
    },
    moeDataCenter: {
      description: 'The datacenter for your Moengage account.',
      label: 'Datacenter',
      type: 'string',
      required: true,
      default: 'dc_1',
      choices: [
        { label: 'DC-01', value: 'dc_1' },
        { label: 'DC-02', value: 'dc_2' },
        { label: 'DC-03', value: 'dc_3' },
        { label: 'DC-04', value: 'dc_4' },
        { label: 'DC-05', value: 'dc_5' },
        { label: 'DC-06', value: 'dc_6' }
      ]
    },
    project_id: {
      description: 'Your Moengage Project ID.',
      label: 'Project ID',
      type: 'string',
      format: 'password',
      required: false
    },
    swPath: {
      label: 'Service Worker Path',
      type: 'string',
      description: 'The path to the service worker file for MoEngage web push notifications. if provided here, you need to host this file on your server.',
      required: false
    },
    enableSPA: {
      label: 'Enable Single Page Application (SPA) Support',
      type: 'boolean',
      description: 'Enable Single Page Application (SPA) support in the Moengage SDK. Enable this if your website is a single page application to ensure proper tracking.',
      required: false,
      default: false
    }, 
    disable_onsite: {
      label: 'Disable Onsite Messaging',
      type: 'boolean',
      description: 'Disable Moengage from showing Onsite Messaging on your website.',
      required: false,
      default: false
    },
    customProxyDomain: {
      label: 'Custom Proxy Domain',
      type: 'string',
      description: 'A custom domain name where the MoEngage web SDK is hosted. Data will be sent to this domain.',
      required: false
    },
    bots_list: {
      label: 'Bots List',
      type: 'string',
      description: 'A comma delimited list of bot user agents to ignore when tracking events.',
      required: false
    },
    disableCookies: {
      label: 'Disable Cookies',
      type: 'boolean',
      description: 'Disable Moengage from setting cookies on your website when the page loads.',
      required: false,
      default: false
    }, 
    disableSdk:{
      label: 'Disable SDK',
      type: 'boolean',
      description: 'Disable the Moengage SDK from initializing on your website when the page loads. You can use this to conditionally load the SDK based on user consent.',
      required: false,
      default: false
    },
    cards_enabled: {
      label: 'Enable Cards',
      type: 'boolean',
      description: 'Enable MoEngage Cards on your website to engage users with personalized content.',
      required: false,
      default: false
    },
    css_selector_inbox_icon: {
      label: 'CSS Selector for Inbox Icon',
      type: 'string',
      description: 'The CSS selector for the MoEngage Inbox icon on your website. The user will click this icon to open the inbox.',
      required: false,
      depends_on:{
        conditions: [
          {
            fieldKey: 'cards_enabled',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    floating_bell_icon_desktop: {
      label: 'Enable Floating Bell Icon on Desktop',
      type: 'boolean',
      description: 'Enable the floating bell icon for MoEngage notifications on desktop devices.',
      required: false,
      depends_on:{
        conditions: [
          {
            fieldKey: 'cards_enabled',
            operator: 'is',
            value: true
          }
        ]
      }
    },
    floating_bell_icon_mobile: {
      label: 'Enable Floating Bell Icon on Mobile',
      type: 'boolean',
      description: 'Enable the floating bell icon for MoEngage notifications on mobile devices.',
      required: false,
      depends_on:{
        conditions: [
          {
            fieldKey: 'cards_enabled',
            operator: 'is',
            value: true
          }
        ]
      }
    }
  },
  initialize: async ({ settings, analytics }, deps) => {
    return await initializeSDK(settings)
  },

  actions: {
    trackEvent
  }
}

export default browserDestination(destination)
