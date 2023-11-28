import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { Bucket } from './types'
import identifyUser from './identifyUser'
import trackEvent from './trackEvent'
import { defaultValues } from '@segment/actions-core'
import group from './group'

declare global {
  interface Window {
    bucket: Bucket
  }
}

export const destination: BrowserDestinationDefinition<Settings, Bucket> = {
  name: 'Bucket Web (Actions)',
  description:
    'Loads the Bucket browser SDK, maps identify(), group() and track() events and enables LiveSatisfaction connections',
  slug: 'bucket-web',
  mode: 'device',

  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    }
  ],

  settings: {
    trackingKey: {
      description: 'Your Bucket App tracking key, found on the tracking page.',
      label: 'Tracking Key',
      type: 'string',
      required: true
    }
  },

  actions: {
    identifyUser,
    group,
    trackEvent
  },

  initialize: async ({ settings, analytics }, deps) => {
    await deps.loadScript('https://cdn.jsdelivr.net/npm/@bucketco/tracking-sdk@2')
    await deps.resolveWhen(() => window.bucket != undefined, 100)

    window.bucket.init(settings.trackingKey)

    // If the analytics client already has a logged in user from a
    // previous session or page, consider the user logged in.
    // In this case we need to call `bucket.user()` to set the persisted
    // user id in bucket and initialize Live Satisfaction
    const segmentPersistedUserId = analytics.user().id()
    if (segmentPersistedUserId) {
      void window.bucket.user(segmentPersistedUserId, {}, { active: false })
    }

    analytics.on('reset', () => {
      window.bucket.reset()
    })

    return window.bucket
  }
}

export default browserDestination(destination)
