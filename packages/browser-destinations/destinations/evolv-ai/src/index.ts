import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import type { Evolv } from './types'
import { initScript } from './init-script'
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
        'When an environment is provided, this integration will load the Evolv AI snippet for that environment. This should only be used if you are not already loading the evolv snippet.',
      label: 'Evolv AI environment key',
      type: 'string',
      default: ''
    },
    useSegmentId: {
      description: `When set, will use segment's anonymous id to track users instead of evolv default.`,
      label: 'Use Segment user id instead of Evolv user id',
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
      description: `If you want to ignore users who take too long to apply the optimization changes then you can use this configuration to limit how long you will wait`,
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
      description: `By default, Evolv stores the user id in local storage. This cannot be read across subdomains (e.g. domain1.example.com to domain2.example.com). If your optimization is crossing subdomains set this to the domain your users will be active across (for example .example.com)`,
      label: 'Cookie domain name to store Evolv uid',
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
      description: 'When set, all Evolv AI confirmations will be sent to segment',
      label: 'Receive experiment confirmations',
      type: 'boolean',
      default: false
    },
    receiveUniqueConfirmations: {
      description: 'When set, only unique confirmations (each experiment per session) will be sent to segment',
      label: 'Receive unique confirmations',
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

    // bindEvents: {
    //   description:
    //     'When a audience name is provided, this integration will also bind all event names to that audience as an array',
    //   label: 'Bind event names to Context attribute',
    //   type: 'string',
    //   default: ''
    // }
    // Add any Segment destination settings required here
  },

  initialize: async ({ settings }, deps) => {
    if (settings.environment) {
      const scriptOptions: { [key: string]: string } = {}
      scriptOptions['data-evolv-environment'] = settings.environment
      scriptOptions['data-evolv-pushstate'] = 'true'
      if (settings.useSegmentId && window.analytics) {
        // @ts-ignore - complex window call
        // scriptOptions['data-evolv-lazy-uid'] = `true`;
        try {
          // @ts-ignore - complex window call
          scriptOptions['data-evolv-uid'] = window.analytics.user().anonymousId()
        } catch (e) {
          console.warn('unable to initialize evolv uid from segment')
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
    initScript({
      // bindEvents: settings.bindEvents
    })

    window.evolv = window.evolv || []
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
