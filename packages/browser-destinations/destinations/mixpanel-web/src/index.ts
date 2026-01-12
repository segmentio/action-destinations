import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Mixpanel, PageViewUrlConfigOption, PersistenceOptions, Config } from './types'
import { defaultValues } from '@segment/actions-core'
import { AUTOCAPTURE_OPTIONS } from './constants'
import { settingFields } from './setting-fields'
import track from './track'
import trackPageView from './trackPageView'
import identify from './identify'
import group from './group'
import alias from './alias'
import { initScript } from './init-script'
declare global {
  interface Window {
    mixpanel: Mixpanel
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Mixpanel> = {
  name: 'Mixpanel Web (actions)',
  slug: 'mixpanel-web-actions',
  mode: 'device',
  settings: settingFields,
  initialize: async ({ settings }) => {
    await initScript()

    const {
      projectToken,
      name,
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

    const numericKeys = new Set([
      'record_sessions_percent',
      'record_min_ms',
      'record_max_ms',
      'record_idle_timeout_ms',
      'cookie_expiration'
    ])
    
    const remainingSettings = Object.fromEntries(
      Object.entries(rest).flatMap(([key, value]) => {
        if (numericKeys.has(key)) {
          if (value === undefined || value === null || value === '') { 
            return [] 
          }
          const num = Number(value)
          if (Number.isNaN(num)) {
            console.warn(`Setting "${key}" with value "${value}" cannot be converted to a number. Setting will be ignored.`)
            return []
          }
          return [[key, num]]
        }
        return [[key, value]]
      })
    )
    
    const config: Config = {
      autocapture:
        autocapture === AUTOCAPTURE_OPTIONS.CUSTOM
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
          : autocapture === AUTOCAPTURE_OPTIONS.ENABLED
          ? true
          : false,
      persistence: persistence as PersistenceOptions,
      ...remainingSettings
    }

    return new Promise<Mixpanel>((resolve) => {
      config.loaded = (mp) => resolve(mp)

      if (name) {
        window.mixpanel.init(projectToken, config, name)
      } else {
        window.mixpanel.init(projectToken, config)
      }
    })
  },
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
  actions: {
    track,
    trackPageView,
    identify,
    group,
    alias
  }
}

export default browserDestination(destination)
