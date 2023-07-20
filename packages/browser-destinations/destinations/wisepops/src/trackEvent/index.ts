import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Wisepops } from '../types'

const action: BrowserActionDefinition<Settings, Wisepops, Payload> = {
  title: 'Track Event',
  description:
    "Send a [custom event](https://support.wisepops.com/article/zbpq1z0exk-set-up-custom-events-to-trigger-popups) to Wisepops. Keep in mind that events are counted as page views in your Wisepops' monthly quota.",
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    eventName: {
      description: 'The name of the event to send to Wisepops.',
      label: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    }
  },
  perform: (wisepops, event) => {
    wisepops('event', event.payload.eventName)
  }
}

export default action
