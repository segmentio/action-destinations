import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { JimoClient } from 'src/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type WindowWithJimoInit = Window & Partial<{ jimoInit: () => void }>

const action: BrowserActionDefinition<Settings, JimoClient, Payload> = {
  title: 'Send User Data',
  description: 'Send user ID and email to Jimo',
  platform: 'web',
  fields: {
    userId: {
      label: 'User ID',
      description: 'The unique user identifier',
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      label: 'User email',
      description: 'The email of the user',
      type: 'string',
      allowNull: true,
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    traits: {
      label: 'User Traits',
      description: 'A list of attributes coming from segment traits',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  defaultSubscription: 'type = "identify"',
  perform: (jimo, { payload, settings }) => {
    const browserWindow: WindowWithJimoInit = window

    const pushEmail = () => {
      if (payload.email == null) return
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      jimo.client().push(['set', 'user:email', [payload.email]])
    }
    const pushTraits = () => {
      if (payload.traits == null) return
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      jimo
        .client()
        .push(['set', 'user:attributes', [payload.traits, settings.refetchExperiencesOnTraitsUpdate ?? false, true]])
    }

    // If a userId is passed, we need to make sure email and attributes changes only happen in the
    // after the identify flow is done, that's why we pass it as a callback of the identify method
    if (payload.userId != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      jimo.client().push([
        'do',
        'identify',
        [
          payload.userId,
          () => {
            pushEmail()
            pushTraits()
          }
        ]
      ])
    }
    // If no user id passed, there is no identify flow trigger, we can just execute the methods directly
    else {
      pushEmail()
      pushTraits()
    }

    const manualInit = settings.manualInit ?? false
    if (
      manualInit &&
      payload.userId &&
      typeof payload.userId === 'string' &&
      payload.userId.length > 0 &&
      window.segmentJimo.initialized === false &&
      browserWindow.jimoInit != null
    ) {
      browserWindow.jimoInit()
      window.segmentJimo.initialized = true
    }
  }
}

export default action
