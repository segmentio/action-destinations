import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Adobe } from '../types'
import { setPageParams, setMbox3rdPartyId } from '../utils'

const action: BrowserActionDefinition<Settings, Adobe, Payload> = {
  title: 'Trigger View',
  defaultSubscription: 'type = "page"',
  description: 'Send page-level data to Adobe Target.',
  platform: 'web',
  fields: {
    viewName: {
      type: 'string',
      description: 'Name of the view or page.',
      label: 'View Name',
      default: {
        '@path': '$.name'
      },
      required: true
    },
    pageParameters: {
      type: 'object',
      description: 'Parameters specific to the view or page.',
      label: 'Page Parameters',
      default: {
        '@path': '$.properties'
      }
    },
    sendNotification: {
      type: 'boolean',
      description:
        'By default, notifications are sent to the Adobe Target backend for incrementing impression count.  If false, notifications are not sent for incrementing impression count. ',
      label: 'Send Notifications to Adobe Target.',
      default: true
    },
    userId: {
      type: 'string',
      description:
        'A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.',
      label: 'Mbox 3rd Party ID',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    }
  },
  perform: (Adobe, event) => {
    const sendNotification = event.payload.sendNotification
    const pageParams = event.payload.pageParameters

    setMbox3rdPartyId(event.payload.userId)

    /*
      NOTE:
      Page data needs to be set before the call to adobe.target.triggerView.
      This is because the page data needs to be part of the global pageParams object.
    */
    setPageParams({ page: { ...pageParams } })

    Adobe.target.triggerView(event.payload.viewName, { page: sendNotification })
  }
}

export default action
