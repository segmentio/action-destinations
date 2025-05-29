import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BehavioralActionPayload } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Behavioral Action',
  description: 'Trigger behavioral actions in AIR based on tracked events',
  defaultSubscription: 'type = "track"',
  fields: {
    identityValue: {
      label: 'User identity value',
      type: 'string',
      description: 'Customer wallet identity value in AIR for this event',
      default: {
        '@path': '$.userId'
      },
      required: true
    },
    walletTransactionReference: {
      label: 'Wallet transaction reference',
      type: 'string',
      description: 'Optional wallet transaction reference from the event triggering this Behavioral Action'
    },
    behavioralActionTriggerReferences: {
      label: 'Behavioral Action trigger reference',
      type: 'string',
      description:
        'Accepts a comma delimited list of reference strings for the Behavioral Action to be executed. E.g.: A0001,P0001',
      default: '',
      required: true
    }
  },
  perform: (request, { settings, payload }) => {
    const triggerReferences = payload.behavioralActionTriggerReferences.replace(/\s*/g, '').split(',')

    const behavioralActionPayload: BehavioralActionPayload = {
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

    return request(settings.connectorUrl, {
      method: 'post',
      headers: {
        'X-Auth-Token': settings.externalKey
      },
      json: behavioralActionPayload
    })
  }
}

export default action
