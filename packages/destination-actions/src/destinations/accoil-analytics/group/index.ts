import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { endpointUrl } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Identify Accounts (groups) in Accoil',
  defaultSubscription: 'type = "group"',
  fields: {
    anonymousId: {
      type: 'string',
      description: 'Anonymous id',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    groupId: {
      type: 'string',
      description: 'The group id',
      label: 'Group ID',
      required: true,
      default: { '@path': '$.groupId' }
    },
    name: {
      type: 'string',
      description:
        'The name of the account. Without providing a name, accounts are displayed using a numeric ID, making them harder to identify. (Highly Recommended)',
      label: 'Name',
      default: { '@path': '$.traits.name' }
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description:
        'Helps calculate account tenure. If no createdAt is provided, the earliest createdAt from the associated users will be used. (Highly Recommended)',
      label: 'Created at',
      default: { '@path': '$.traits.createdAt' }
    },
    status: {
      type: 'string',
      description:
        'The overall status of your the account subscription. Possible options include: Free, Trial, Paid, Cancelled (Highly Recommended)',
      label: 'Status',
      default: { '@path': '$.traits.status' }
    },
    plan: {
      type: 'string',
      description:
        'The plan type helps in segmenting accounts by their subscription tier (e.g., starter, pro, enterprise). (Recommended)',
      label: 'Plan',
      default: { '@path': '$.traits.plan' }
    },
    mrr: {
      type: 'number',
      description:
        'Monthly recurring revenue (MRR) is important for segmenting accounts by value. It also allows Accoil to show the dollar value of different segments. Ideally this is passed in cents eg $99 becomes 9900. (Highly Recommended)',
      label: 'MRR',
      default: { '@path': '$.traits.mrr' }
    },
    traits: commonFields.traits,
    timestamp: commonFields.timestamp
  },
  perform: (request, { payload, settings }) => {
    const traits = {
      ...(payload.traits ?? {}),
      name: payload.name,
      createdAt: payload.createdAt,
      status: payload.status,
      plan: payload.plan,
      mrr: payload.mrr
    }

    return request(endpointUrl(settings.api_key), {
      method: 'post',
      json: {
        type: 'group',
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        groupId: payload.groupId,
        traits: traits,
        timestamp: payload.timestamp
      }
    })
  }
}

export default action
