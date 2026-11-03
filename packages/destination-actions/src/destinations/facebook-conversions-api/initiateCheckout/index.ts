import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { initiateCheckoutFields } from '../shared/fields'
import { send, getInitiateCheckoutEventData } from '../shared/functions'
import { EventType } from '../shared/constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Initiate Checkout',
  description: 'Send event when a user enters the checkout flow',
  defaultSubscription: 'type = "track" and event = "Checkout Started"',
  fields: initiateCheckoutFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    return send(
      request,
      payload,
      settings,
      getInitiateCheckoutEventData,
      EventType.InitiateCheckout,
      features,
      statsContext
    )
  }
}

export default action
