import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Wisepops } from '../types'

const action: BrowserActionDefinition<Settings, Wisepops, Payload> = {
  title: 'Track Goal',
  description: '[Track goals and revenue](https://support.wisepops.com/article/mx3z8na6yb-set-up-goal-tracking) to know which campaigns are generating the most value.',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  platform: 'web',
  fields: {
    goalName: {
      description: 'This is a 32-character identifier, visible when you create the JS goal in Wisepops.',
      label: 'Goal Identifier',
      type: 'string',
      required: false,
    },
    goalRevenue: {
      description: 'The revenue associated with the goal.',
      label: 'Goal Revenue',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.revenue'
      }
    },
  },
  perform: (wisepops, event) => {
    let revenue = null;
    if (['string', 'number'].includes(typeof event.payload.goalRevenue) && !Number.isNaN(Number(event.payload.goalRevenue))) {
      revenue = Number(event.payload.goalRevenue);
    }
    if (typeof event.payload.goalName === 'string' && /^[a-zA-Z0-9]{32}$/.test(event.payload.goalName)) {
      revenue = {revenue};
    }
    wisepops('goal', event.payload.goalName, revenue);
  }
}

export default action
