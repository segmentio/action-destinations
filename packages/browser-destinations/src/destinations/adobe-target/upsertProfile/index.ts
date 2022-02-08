import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import { Adobe } from '../types'
import type { Payload } from './generated-types'
import { setPageParams } from '../utils'

const action: BrowserActionDefinition<Settings, Adobe, Payload> = {
  title: 'Upsert Profile',
  description: 'Create or update a user profile in Adobe Target.',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      description:
        'A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.',
      label: 'User ID',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    anonymousId: {
      type: 'string',
      required: true,
      description: 'Anonymous identifier for the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      required: true,
      description: 'Profile parameters specific to a user.',
      label: 'User Attributes',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (Adobe, event) => {
    /*
       NOTE:
       identify() and track() actions leverage the same function (adobe.target.trackEvent()) to send data to Adobe.
       identify does not pass an event name, track does.
    */
    const user = {
      mbox3rdpartyid: event.payload.anonymousId
    }
    if (event.payload.userId) {
      user.mbox3rdpartyid = event.payload.userId
    }

    /*
      NOTE:
      Profile data needs to be set before the call to adobe.target.trackEvent.
      This is because the profile data needs to be part of the global pageParams object.
    */
    setPageParams({
      profile: {
        ...event.payload.traits,
        ...user
      }
    })

    const params = {
      mbox: event.settings.mbox_name,
      params: {
        type: 'profile_update' // DO NOT CHANGE. profile_update is used to differentiate between track and identify calls.
      }
    }

    Adobe.target.trackEvent(params)
  }
}

export default action
