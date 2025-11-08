import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Mixpanel, PageViewUrlConfigOption, PersistenceOptions } from './types'
import { PAGE_VIEW_URL_CONFIG_OPTIONS, PERSISTENCE_OPTIONS } from './constants'
import track from './track'

import trackPageView from './trackPageView'

import identify from './identify'

import group from './group'

declare global {
  interface Window {
    mixpanel: Mixpanel
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Mixpanel> = {
  name: 'Mixpanel Web (actions)',
  slug: 'actions-mixpanel-web-actions',
  mode: 'device',

  settings: {
    projectToken: {
      description: 'Your Mixpanel project token.',
      label: 'Project Token',
      type: 'string',
      required: true
    },
    api_host: {
      description: 'The Mixpanel API host to send data to.',
      label: 'API Host',
      type: 'string',
      format: 'uri',
      required: true,
      default: 'https://api-js.mixpanel.com'
    },
    autocapture: {
      description:
        'Enable or disable Mixpanel autocapture functionality. Select "Custom" to specify fine grained control over which events are autocaptured.',
      label: 'Autocapture',
      type: 'string',
      choices: [
        { label: 'Enabled', value: 'enabled' },
        { label: 'Disabled', value: 'disabled' },
        { label: 'Custom', value: 'custom' }
      ],
      default: 'enabled'
    },
    pageview: {
      description: 'Capture pageview events automatically',
      label: 'Autocapture Pageview',
      type: 'string',
      choices: [
        { label: 'Full URL', value: PAGE_VIEW_URL_CONFIG_OPTIONS.FULL_URL },
        { label: 'URL with Path and Query String', value: PAGE_VIEW_URL_CONFIG_OPTIONS.URL_WITH_PATH_AND_QUERY_STRING },
        { label: 'URL with Path', value: PAGE_VIEW_URL_CONFIG_OPTIONS.URL_WITH_PATH }
      ],
      default: PAGE_VIEW_URL_CONFIG_OPTIONS.FULL_URL,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    click: {
      description: 'Capture click events automatically',
      label: 'Autocapture Click',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    dead_click: {
      description: 'Capture dead click events automatically',
      label: 'Autocapture Dead Click',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    input: {
      description: 'Capture input events automatically',
      label: 'Autocapture Input',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    rage_click: {
      description: 'Capture rage click events automatically',
      label: 'Autocapture Rage Click',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    scroll: {
      description: 'Capture scroll events automatically',
      label: 'Autocapture Scroll',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    submit: {
      description: 'Capture form submit events automatically',
      label: 'Autocapture Submit',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    capture_text_content: {
      description: 'Capture text content of elements in autocaptured events',
      label: 'Autocapture Capture Text Content',
      type: 'boolean',
      default: false,
      depends_on: {
        conditions: [
          {
            fieldKey: 'autocapture',
            operator: 'is',
            value: 'custom'
          }
        ]
      }
    },
    cross_subdomain_cookie: {
      description: 'Enable or disable cross subdomain cookies for Mixpanel.',
      label: 'Cross Subdomain Cookie',
      type: 'boolean',
      default: true
    },
    persistence: {
      description: 'Set the persistence method for Mixpanel (cookie or localStorage).',
      label: 'Persistence Method',
      type: 'string',
      choices: [
        { label: 'Cookie', value: PERSISTENCE_OPTIONS.COOKIE },
        { label: 'Local Storage', value: PERSISTENCE_OPTIONS.LOCAL_STORAGE }
      ],
      default: PERSISTENCE_OPTIONS.COOKIE
    },
    track_marketing: {
      description:
        'Enable or disable tracking of marketing campaigns in Mixpanel. Includes UTM parameters and click identifiers for various ad platforms.',
      label: 'Track Marketing Campaigns',
      type: 'boolean',
      default: true
    },
    cookie_expiration: {
      description: 'Set the cookie expiration time in days for Mixpanel cookies.',
      label: 'Cookie Expiration (days)',
      type: 'number',
      default: 365
    },
    disable_persistence: {
      description: 'Disable all persistence mechanisms for Mixpanel.',
      label: 'Disable Persistence',
      type: 'boolean',
      default: false
    },
    ip: {
      description: 'Enable or disable sending IP address information to Mixpanel.',
      label: 'Send IP Address',
      type: 'boolean',
      default: true
    },
    record_block_class: {
      description: 'CSS class to block elements from being recorded in session recordings.',
      label: 'Record Block Class',
      type: 'string',
      default: 'mp-block'
    },
    record_block_selector: {
      description: 'CSS selector to block elements from being recorded in session recordings.',
      label: 'Record Block Selector',
      type: 'string',
      default: 'img, video, audio'
    },
    record_canvas: {
      description: 'Enable or disable recording of canvas elements in session recordings.',
      label: 'Record Canvas',
      type: 'boolean',
      default: false
    },
    record_heatmap_data: {
      description: 'Enable or disable tracking of heatmap events in session recordings.',
      label: 'Record Heatmap Data',
      type: 'boolean',
      default: false
    },
    record_idle_timeout_ms: {
      description: 'Idle timeout in milliseconds for session recordings.',
      label: 'Record Idle Timeout (ms)',
      type: 'number',
      default: 180_000
    },
    record_mask_text_class: {
      description: 'CSS class to mask text elements in session recordings.',
      label: 'Record Mask Text Class',
      type: 'string',
      default: 'mp-mask'
    },
    record_mask_text_selector: {
      description: 'CSS selector to mask text elements in session recordings.',
      label: 'Record Mask Text Selector',
      type: 'string',
      default: '*'
    },
    record_max_ms: {
      description: 'Maximum recording time in milliseconds for session recordings.',
      label: 'Record Max (ms)',
      type: 'number',
      default: 86_400_000
    },
    record_min_ms: {
      description: 'Minimum recording time in milliseconds for session recordings.',
      label: 'Record Min (ms)',
      type: 'number',
      default: 0,
      minimum: 0,
      maximum: 8_000
    },
    record_sessions_percent: {
      description: 'Percentage of sessions to record for session recordings.',
      label: 'Record Sessions Percent',
      type: 'number',
      default: 0,
      minimum: 0,
      maximum: 100
    }
  },

  initialize: async ({ settings }, deps) => {
    await deps.loadScript('https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js')
    await deps.resolveWhen(() => window.mixpanel != null, 100)
    const mixpanel = window.mixpanel

    const {
      projectToken,
      autocapture,
      pageview,
      click,
      dead_click,
      input,
      rage_click,
      scroll,
      submit,
      capture_text_content,
      persistence,
      ...rest
    } = settings

    mixpanel.init(projectToken, {
      autocapture:
        autocapture === 'custom'
          ? {
              pageview: pageview as PageViewUrlConfigOption,
              click,
              dead_click,
              input,
              rage_click,
              scroll,
              submit,
              capture_text_content
            }
          : autocapture === 'enabled'
          ? true
          : false,
      persistence: persistence as PersistenceOptions,
      ...rest
    })
    return mixpanel
  },

  actions: {
    track,
    trackPageView,
    identify,
    group
  }
}

export default browserDestination(destination)
