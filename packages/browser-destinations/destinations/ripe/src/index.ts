import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { RipeSDK } from './types'

import group from './group'
import identify from './identify'
import track from './track'

import { defaultValues } from '@segment/actions-core'
import { initScript } from './init-script'

import page from './page'

const defaultVersion = 'latest'

declare global {
  interface Window {
    Ripe: RipeSDK
  }
}

export const destination: BrowserDestinationDefinition<Settings, RipeSDK> = {
  name: 'Ripe Device Mode (Actions)',
  slug: 'actions-ripe',
  mode: 'device',

  settings: {
    sdkVersion: {
      description: 'The version of the Ripe Widget SDK to use',
      label: 'SDK Version',
      type: 'string',
      choices: [
        {
          value: 'latest',
          label: 'latest'
        }
      ],
      default: defaultVersion,
      required: false
    },
    apiKey: {
      description: 'The Ripe API key found in the Ripe App',
      label: 'API Key',
      type: 'string',
      required: true
    },
    endpoint: {
      label: 'API Endpoint',
      description: `The Ripe API endpoint (do not change this unless you know what you're doing)`,
      type: 'string',
      format: 'uri',
      default: 'https://storage.getripe.com'
    }
  },

  initialize: async ({ settings }, deps) => {
    initScript()

    const { sdkVersion, apiKey } = settings
    const version = sdkVersion ?? defaultVersion
    const endpoint = settings.endpoint || 'https://storage.getripe.com'

    await deps
      .loadScript(`${endpoint}/sdk/${version}/sdk.umd.js`)
      .catch((err) => console.error('Unable to load Ripe SDK script', err))

    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'Ripe'), 100)
    await window.Ripe.init(apiKey)

    return window.Ripe
  },

  actions: {
    group,
    identify,
    page,
    track
  },

  presets: [
    {
      name: 'Group user',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    },
    {
      name: 'Identify user',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Page view',
      subscribe: 'type = "page"',
      partnerAction: 'page',
      mapping: defaultValues(page.fields),
      type: 'automatic'
    },
    {
      name: 'Track event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    }
  ]
}

export default browserDestination(destination)
