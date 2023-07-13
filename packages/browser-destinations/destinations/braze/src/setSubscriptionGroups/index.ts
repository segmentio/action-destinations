import { BrazeDestinationClient } from '../braze-types'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, BrazeDestinationClient, Payload> = {
  title: 'Set Subscription Groups',
  description: 'Subscribe or unsubscribe from Braze Subscription Groups',
  platform: 'web',
  defaultSubscription: 'type = "identify" and property = "braze_subscription_groups"',
  fields: {
    subscriptionGroups: {
      label: 'Subscription Groups',
      description: 'A list of subscription group IDs and states to set. Subscription group states can be either "subscribed" or "unsubscribed". Subscription Group IDs are found in the Braze dashboard.',
      type: 'object',
      multiple: true,
      default: {
        '@path': '$.traits'
      },
      properties: {
        subscription_group_id: {
          label: "Subscription Group ID",
          type: 'string',
          required: true,
        },
        subscription_group_state: {
          label: "Subscription Group State",
          type: "string",
          required: true,
          choices: [{value: "subscribed", label: "Subscribed"}, {value: "unsubscribed", label: "unsubscribed"}]
        }
      }
    }
  },
  perform: (client, data) => {
    if (!client.ready()) {
      return
    }

    const payload = data.payload

    if (!Array.isArray(payload.subscriptionGroups)) {
      console.warn(`setSubscriptionGroup action was called when missing braze_subscription_groups identify trait`)
      return
    }

    payload.subscriptionGroups.forEach(group => {
      if (group && group.subscription_group_id && group.subscription_group_state) {
        if (group.subscription_group_state === 'subscribed') {
          client.instance.getUser()?.addToSubscriptionGroup(group.subscription_group_id)
        }
        if (group.subscription_group_state === 'unsubscribed') {
          client.instance.getUser()?.removeFromSubscriptionGroup(group.subscription_group_id)
        }
      }
    })
  }
}

export default action
