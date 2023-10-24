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
      description: 'Pendo Visitor ID. Maps to Segment userId',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      },
      readOnly: true
    },
    accountId: {
      label: 'Account ID',
      description: 'Pendo Account ID',
      type: 'string',
      required: true,
      default: { '@path': '$.groupId' },
      readOnly: true
    },
    accountData: {
      label: 'Account Metadata',
      description: 'Additional Account data to send',
      type: 'object',
      required: false,
      default: { '@path': '$.traits' },
      readOnly: true
    }
  },
  perform: (pendo, event) => {
    const payload: PendoOptions = {
      visitor: {
        id: event.payload.visitorId
      },
      account: {
        ...event.payload.accountData,
        id: event.payload.accountId
      }
    }

    // If parentAccount exists in group traits, lift it out of account properties into options properties
    // https://github.com/segmentio/analytics.js-integrations/blob/master/integrations/pendo/lib/index.js#L136
    if (payload.account?.parentAccount) {
      payload.parentAccount = payload.account.parentAccount
      delete payload.account.parentAccount
    }

    pendo.identify(payload)
  }
}

export default action
