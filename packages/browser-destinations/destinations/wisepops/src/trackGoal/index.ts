import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Wisepops } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Wisepops, Payload> = {
  title: 'Track Goal',
  description:
    '[Track goals and revenue](https://support.wisepops.com/article/mx3z8na6yb-set-up-goal-tracking) to know which campaigns are generating the most value.',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  platform: 'web',
  fields: {
    goalName: {
      description: 'The name of the goal to send to Wisepops.',
      label: 'Goal Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.event'
      }
    },
    goalRevenue: {
      description: 'The revenue associated with the goal.',
      label: 'Goal Revenue',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.revenue'
      }
    }
  },
  perform: (wisepops, event) => {
    wisepops('goal', event.payload.goalName, event.payload.goalRevenue)
  }
}

export default action
