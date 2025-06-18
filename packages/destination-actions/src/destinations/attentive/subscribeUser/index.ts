import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userIdentifiers, occurredAt, externalEventId, subscriptionType, locale, signUpSourceId, singleOptIn } from '../fields'
import { API_URL, API_VERSION } from '../constants'
import { formatSubscribeUserJSON, validate, validateSubscribeUser } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe User to Attentive',
  description: 'Send a subscription request to Attentive.',
  defaultSubscription: 'type = "track" and event = "User Subscibed"',
  fields: {
    userIdentifiers,
    occurredAt,
    externalEventId,
    subscriptionType,
    locale,
    signUpSourceId,
    singleOptIn
  },
  perform: (request, { payload }) => {
    validate(payload)
    validateSubscribeUser(payload)
    return request(`${API_URL}/${API_VERSION}/subscriptions`, {
      method: 'post',
      json: formatSubscribeUserJSON(payload)
    })
  }
}

export default action
