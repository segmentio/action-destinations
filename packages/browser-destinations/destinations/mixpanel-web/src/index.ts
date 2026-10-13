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
      instanceName,
      sourceName,
      autocapture,
      pageview,
      click,
      dead_click,
      input,
      rage_click,
      scroll,
      submit,
      capture_text_content,
      api_host,
      cross_subdomain_cookie,
      persistence,
      track_marketing,
      cookie_expiration,
      disable_persistence,
      ip,
      record_block_class,
      record_block_selector,
      record_canvas,
      record_heatmap_data,
      record_idle_timeout_ms,
      record_mask_all_text,
      record_mask_text_class,
      record_mask_text_selector,
      record_unmask_text_selector,
      record_mask_all_inputs,
      record_mask_input_selector,
      record_unmask_input_selector,
      record_max_ms,
      record_min_ms,
      record_sessions_percent
    } = settings

    const asString = (value: unknown): string | undefined => {
      if (typeof value !== 'string') {
        return undefined
      }
      const trimmed = value.trim()
      return trimmed === '' ? undefined : trimmed
    }

    const asNumber = (value: unknown): number | undefined => {
      if (typeof value === 'number') {
        return Number.isNaN(value) ? undefined : value
      }
      if (typeof value === 'string' && value.trim() !== '') {
        const num = Number(value)
        return Number.isNaN(num) ? undefined : num
      }
      return undefined
    }

    const asBoolean = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined)

    const defined = (obj: Partial<Config>): Partial<Config> =>
      Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<Config>

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
      ...defined({
        api_host: asString(api_host),
        persistence: asString(persistence) as PersistenceOptions | undefined,
        cross_subdomain_cookie: asBoolean(cross_subdomain_cookie),
        track_marketing: asBoolean(track_marketing),
        cookie_expiration: asNumber(cookie_expiration),
        disable_persistence: asBoolean(disable_persistence),
        ip: asBoolean(ip),
        record_block_class: asString(record_block_class),
        record_block_selector: asString(record_block_selector),
        record_canvas: asBoolean(record_canvas),
        record_heatmap_data: asBoolean(record_heatmap_data),
        record_idle_timeout_ms: asNumber(record_idle_timeout_ms),
        record_mask_all_text: asBoolean(record_mask_all_text),
        record_mask_text_class: asString(record_mask_text_class),
        record_mask_text_selector: asString(record_mask_text_selector),
        record_unmask_text_selector: asString(record_unmask_text_selector),
        record_mask_all_inputs: asBoolean(record_mask_all_inputs),
        record_mask_input_selector: asString(record_mask_input_selector),
        record_unmask_input_selector: asString(record_unmask_input_selector),
        record_max_ms: asNumber(record_max_ms),
        record_min_ms: asNumber(record_min_ms),
        record_sessions_percent: asNumber(record_sessions_percent)
      })
    }
    return new Promise<Mixpanel>((resolve) => {
      config.loaded = (mp) => {
        const trimmedSourceName = sourceName?.trim()
        if (trimmedSourceName && typeof mp?.register === 'function') {
          // Registered as a super property so it is attached to every event
          mp.register({ segment_source_name: trimmedSourceName })
        }
        resolve(mp)
      }

      if (instanceName) {
        window.mixpanel.init(projectToken, config, instanceName)
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
