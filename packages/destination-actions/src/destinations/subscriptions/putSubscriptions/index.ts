import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

//This is identify endpoint used only if the events are not in batch
const getIdentifyEndpoint = (environment: string): string => {
  return `https://api.segment.${environment === 'production' ? 'com' : 'build'}/v1/identify`
}
// Batch endpoint for identify calls
const getBatchEndpoint = (environment: string): string => {
  return `https://api.segment.${environment === 'production' ? 'com' : 'build'}/v1/batch`
}

// Validate event for email/sms subscriptions
const validSubscriptions = [true, false, 'SUBSCRIBED', 'UNSUBSCRIBED', 'DID-NOT-SUBSCRIBE']
const validate = (traits: any) => {
  if (
    traits?.__segment_internal_email_subscription__ &&
    traits?.email &&
    validSubscriptions.includes(traits?.__segment_internal_email_subscription__)
  ) {
    return true
  }
  if (
    traits?.__segment_internal_sms_subscription__ &&
    traits?.phone &&
    validSubscriptions.includes(traits?.__segment_internal_sms_subscription__)
  ) {
    return true
  }
  return false
}

// generate messaging context
const generateMessagingContext = (traits: any) => {
  const messagingSubscriptions = []
  if (traits?.__segment_internal_email_subscription__ && traits?.email) {
    messagingSubscriptions.push({
      key: traits.email,
      type: 'EMAIL',
      status: traits.__segment_internal_email_subscription__
    })
  }
  if (traits?.__segment_internal_sms_subscription__ && traits?.phone) {
    messagingSubscriptions.push({
      key: traits.phone,
      type: 'SMS',
      status: traits.__segment_internal_sms_subscription__
    })
  }
  return messagingSubscriptions
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Put Subscriptions',
  description: '',
  fields: {
    context: {
      label: 'Context',
      description: 'event Context',
      type: 'object',
      required: false,
      default: { '@path': '$.context' }
    },
    traits: {
      label: 'Traits',
      description: "A user profile's traits",
      type: 'object',
      required: true,
      default: { '@path': '$.traits' }
    },
    integrations: {
      label: 'integrations',
      description: 'Event Integrations field',
      type: 'object',
      required: false,
      default: { '@path': '$.integrations' }
    },
    userId: {
      label: 'User ID',
      description: 'Customer User ID in Segment',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'Customer Anonymous ID in Segment',
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    writeKey: {
      label: 'Writekey',
      description: 'The Engage/Personas space Write Key',
      type: 'string',
      required: false,
      default: { '@path': '$.writeKey' }
    }
  },
  perform: (request, { settings, payload }) => {
    if (validate(payload.traits)) {
      console.log('Valid event')
    } else {
      throw new Error('Invalid Event')
    }
    const reqContext = {
      ...payload.context,
      messaging_subscriptions: generateMessagingContext(payload.traits)
    }

    const req = {
      context: reqContext,
      traits: payload.traits,
      integrations: {
        All: false,
        Warehouses: {
          all: false
        }
      }
    }

    return request(getIdentifyEndpoint(settings.environment), {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      username: payload.writeKey,
      password: '',
      json: req,
      throwHttpErrors: false
    })
  },
  performBatch: (request, { settings, payload }) => {
    return request(getBatchEndpoint(settings.environment), {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      username: settings.spaceWriteKey,
      password: '',
      json: payload,
      throwHttpErrors: false
    })
  }
}

export default action
