import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { PendoSDK, PendoOptions } from '../types'

const action: BrowserActionDefinition<Settings, PendoSDK, Payload> = {
  title: 'Send Group Event',
  description: 'Send Segment group() events to Pendo',
  defaultSubscription: 'type="group"',
  platform: 'web',
  fields: {
    visitorId: {
      label: 'Visitor ID',
      description: 'Pendo Visitor ID. Defaults to Segment userId',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    accountId: {
      label: 'Account ID',
      description: 'Pendo Account ID. This overrides the Pendo Account ID setting',
      type: 'string',
      required: true,
      default: { '@path': '$.groupId' }
    },
    accountData: {
      label: 'Account Metadata',
      description: 'Additional Account data to send',
      type: 'object',
      required: false
    },
    parentAccountId: {
      label: 'Parent Account ID',
      description:
        'Pendo Parent Account ID. This overrides the Pendo Parent Account ID setting. Note: Contact Pendo to request enablement of Parent Account feature.',
      type: 'string',
      required: false
    },
    parentAccountData: {
      label: 'Parent Account Metadata',
      description:
        'Additional Parent Account data to send. Note: Contact Pendo to request enablement of Parent Account feature.',
      type: 'object',
      required: false
    }
  },
  perform: (pendo, event) => {
    const payload: PendoOptions = {
      visitor: {
        id: event.payload.visitorId
      }
    }
    if (event.payload.accountId) {
      payload.account = {
        ...event.payload.accountData,
        id: event.payload.accountId
      }
    }
    if (event.payload.parentAccountId) {
      payload.parentAccount = {
        ...event.payload.parentAccountData,
        id: event.payload.parentAccountId
      }
    }
    pendo.identify(payload)
  }
}

export default action
