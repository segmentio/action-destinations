import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Evolv } from './types'
import { defaultValues } from '@segment/actions-core'
import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import { listenForEvolvConfirmation } from './source'

declare global {
  interface Window {
    evolv: Evolv
  }
}

// Switch from unknown to the partner SDK client types
export const destination: BrowserDestinationDefinition<Settings, Evolv> = {
  name: 'Evolv AI Web Mode (Actions)',
  slug: 'actions-evolv-ai-web',
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
    environment: {
      description:
        'To load the Evolv AI snippet via Segment, include your Environment API Key found in the Evolv AI Manager. This option should only be used if you are not already loading the Evolv AI snippet on your site.',
      label: 'Evolv AI Environment Key',
      type: 'string',
      default: ''
    },
    useSegmentId: {
      description: `When using this option, Evolv AI will levarage the Segment Anonymous ID instead of generating a new user id.`,
      label: `Use Segment's Anonymous ID as the Evolv user id`,
      type: 'boolean',
      depends_on: {
        conditions: [
          {
            fieldKey: 'environment',
            operator: 'is_not',
            value: ''
          }
        ]
      },
      default: false
    },
    evolvTimeout: {
      description: `If you want to ignore users who take too long to apply the optimization changes, then you can use this configuration to limit how long Evolv AI should wait till the page renders.`,
      label: 'Evolv Timeout',
      type: 'number',
      depends_on: {
        conditions: [
          {
            fieldKey: 'environment',
            operator: 'is_not',
            value: ''
          }
        ]
      },
      default: 10000
    },
    useCookies: {
      description: `By default, Evolv AI stores the user id in localStorage. Since localStorage cannot be read across subdomains (e.g. domain1.example.com to domain2.example.com), you will need to specify a cookie domain (for example .example.com) in order to track users across subdomains.`,
      label: 'Cookie domain name to store Evolv AI user id',
      type: 'string',
      depends_on: {
        conditions: [
          {
            fieldKey: 'environment',
            operator: 'is_not',
            value: ''
          },
          {
            fieldKey: 'useSegmentId',
            operator: 'is',
            value: false
          }
        ]
      },
      default: ''
    },
    receiveConfirmations: {
      description: 'When set, all Evolv AI confirmations for each project will be sent to Segment.',
      label: 'Receive all Evolv AI project confirmations',
      type: 'boolean',
      default: true
    },
    receiveUniqueConfirmations: {
      description: 'When set, only unique confirmations (once per project per session) will be sent to Segment.',
      label: 'Receive unique project confirmations only',
      type: 'boolean',
      depends_on: {
        conditions: [
          {
            fieldKey: 'receiveConfirmations',
            operator: 'is',
            value: true
          }
        ]
      },
      default: false
    }
  },

  initialize: async ({ settings }, deps) => {
    if (settings.environment) {
      const scriptOptions: { [key: string]: string } = {}
      scriptOptions['data-evolv-environment'] = settings.environment
      scriptOptions['data-evolv-pushstate'] = 'true'
      if (settings.useSegmentId) {
        try {
          // @ts-ignore - complex window call
          scriptOptions['data-evolv-lazy-uid'] = 'true'
        } catch (e) {
          console.warn('unable to initialize Evolv AI user id from segment')
        }
      }
      if (settings.useCookies) {
        scriptOptions['data-evolv-use-cookies'] = settings.useCookies
      }
      if (settings.evolvTimeout && settings.evolvTimeout !== 10000) {
        scriptOptions['data-evolv-timeout'] = settings.evolvTimeout.toString()
      }
      await deps.loadScript('https://media.evolv.ai/asset-manager/releases/latest/webloader.min.js', scriptOptions)
    }

    window.evolv = window.evolv || {}
    await deps.resolveWhen(() => Object.prototype.hasOwnProperty.call(window, 'evolv'), 100)

    if (settings.receiveConfirmations) {
      listenForEvolvConfirmation(['confirmed'], settings.receiveUniqueConfirmations)
    }
    return window.evolv
  },

  actions: {
    trackEvent,
    identifyUser
  }
}

export default browserDestination(destination)
