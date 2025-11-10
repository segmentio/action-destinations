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
  slug: 'actions-mixpanel-web-actions',
  mode: 'device',
  settings: settingFields,
  initialize: async ({ settings }, deps) => {
    await initScript()
    await deps.resolveWhen(() => window?.mixpanel != null, 100)
    const mixpanel = window.mixpanel

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
      ...rest
    }

    if (name) {
      mixpanel.init(projectToken, config, name)
    } else {
      mixpanel.init(projectToken, config)
    }
    return mixpanel
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
