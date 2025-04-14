import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Behavioral Action',
  description: 'Trigger bahvioral actions in EE AIR based on tracked events',
  defaultSubscription: 'type = "track"',
  fields: {
    identityValue: {
      label: 'User identity value',
      type: 'string',
      description: 'Identity value in AIR of the customer wallet for this event',
      default: {
        '@path': '$.userId'
      }
    },
    walletTransactionReference: {
      label: 'Wallet transaction reference',
      type: 'string',
      description: 'Reference string for the Behavioral Action to be executed. E.g.: A0001',
      default: {
        '@path': '$.properties.order_id'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const triggerReferences = settings.behavioralActionTriggerReference.replace(/\s*/g, '').split(',')

    return request(settings.connectorUrl, {
      method: 'post',
      headers: {
        'X-Auth-Token': settings.externalKey
      },
      json: {
        type: 'services/trigger',
        body: {
          identityValue: payload.identityValue,
          walletTransaction: payload.walletTransactionReference
            ? {
                reference: payload.walletTransactionReference
              }
            : undefined,
          triggers: triggerReferences.map((triggerReference) => ({
            reference: triggerReference
          }))
        }
      }
    })
  }
}

export default action
