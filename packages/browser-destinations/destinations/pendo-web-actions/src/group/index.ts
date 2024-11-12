import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { PendoSDK, PendoOptions } from '../types'
import { removeNestedObject, AnyObject, getSubstringDifference } from '../utils'

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
      description:
        'Pendo Account ID. Maps to Segment groupId.  Note: If you plan to change this, enable the setting "Use custom Segment group trait for Pendo account id"',
      type: 'string',
      required: true,
      default: { '@path': '$.groupId' },
      readOnly: false
    },
    accountData: {
      label: 'Account Metadata',
      description: 'Additional Account data to send',
      type: 'object',
      required: false,
      default: { '@path': '$.traits' },
      readOnly: false
    },
    parentAccountData: {
      label: 'Parent Account Metadata',
      description:
        'Additional Parent Account data to send. Note: Contact Pendo to request enablement of Parent Account feature.',
      type: 'object',
      properties: {
        id: {
          label: 'Parent Account ID',
          type: 'string',
          required: true
        }
      },
      additionalProperties: true,
      default: { '@path': '$.traits.parentAccount' },
      required: false
    }
  },
  perform: (pendo, { mapping, payload }) => {
    // remove parentAccountData field data from the accountData if the paths overlap

    type pathMapping = {
      '@path': string
    }

    const parentAccountDataMapping = mapping && (mapping.parentAccountData as pathMapping)?.['@path']
    const accountDataMapping = mapping && (mapping.accountData as pathMapping)?.['@path']

    const difference: string | null = getSubstringDifference(parentAccountDataMapping, accountDataMapping)

    let accountData = undefined
    if (difference !== null) {
      accountData = removeNestedObject(payload.accountData as AnyObject, difference)
    } else {
      accountData = payload.accountData
    }

    const pendoPayload: PendoOptions = {
      visitor: {
        id: payload.visitorId
      },
      account: {
        ...accountData,
        id: payload.accountId
      }
    }

    if (payload.parentAccountData) {
      pendoPayload.parentAccount = payload.parentAccountData
    }

    pendo.identify(pendoPayload)
  }
}

export default action
