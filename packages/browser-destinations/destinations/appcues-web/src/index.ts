import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Appcues } from './types'
import track from './track'
import page from './page'
import identify from './identify'
import group from './group'
import { URL } from './constants'
import { defaultValues } from '@segment/actions-core'

export const destination: BrowserDestinationDefinition<Settings, Appcues> = {
  name: 'Appcues Web',
  slug: 'appcues-web-actions',
  mode: 'device',
  settings: {
    accountID: {
      label: 'Appcues Account ID',
      description: 'Your Appcues Account ID.',
      type: 'password',
      required: true
    },
    region: {
      label: 'Region',
      description: 'Select the Appcues region for your account.',
      type: 'string',
      required: true,
      choices: [
        { label: 'US', value: 'US' },
        { label: 'EU', value: 'EU' }
      ],
      default: 'US'
    },
    enableURLDetection: {
      label: 'Enable URL Detection',
      description:
        'Enable or disable URL detection in Appcues. If enabled, page events should not be triggered manually using the page action.',
      type: 'boolean',
      required: true,
      default: false
    }
  },
  initialize: async ({ settings }, deps) => {
    const { region, accountID, enableURLDetection } = settings
    const url = region === 'EU' ? URL.EU : URL.US
    window.AppcuesSettings = { enableURLDetection }
    await deps.loadScript(`//${url}/${accountID}.js`)
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'Appcues'), 100)
    return window.Appcues
  },
  presets: [
    {
      name: 'Page',
      subscribe: 'type = "page"',
      partnerAction: 'page',
      mapping: defaultValues(page.fields),
      type: 'automatic'
    }
  ],
  actions: {
    track,
    page,
    identify,
    group
  }
}

export default browserDestination(destination)
