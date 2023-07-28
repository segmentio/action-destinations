import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, cartItems, customerProfileId, identifier } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Customer Session V2',
  description: 'This updates a customer session. Create all the required attributes before using this endpoint.',
  fields: {
    customerSessionId: {
      label: 'Customer Session ID',
      description: 'The customer session integration identifier to use in Talon.One.',
      type: 'string',
      required: true
    },
    callbackDestination: {
      label: 'Callback Destination URI',
      description: 'This specifies the address of the service and its endpoint to do callback request.',
      type: 'string',
      placeholder: 'http://mydomain.com/api/callback_here'
    },
    callbackAPIKey: {
      type: 'string',
      label: 'Callback API Key',
      description: 'This specifies API key and relative header. The header is specified optionally',
      placeholder: 'X-API-Key 123456789123456789123456789123456789'
    },
    contentFields: {
      type: 'string',
      label: 'Content Fields',
      description:
        'This specifies a list of the fields from the response you need to receive. Comma character is separator. If omitted, all the fields will be forwarded from the response to the callback destination.',
      placeholder: 'effects,customerProfile',
      default: 'effects'
    },
    callbackCorrelationId: {
      type: 'string',
      label: 'Correlation ID',
      description:
        'This specifies ID of the request that will be forwarded to the destination URI with the callback request with the same header name. If omitted, the X-Correlation-ID will not be in the callback request.'
    },
    skipNonExistingAttributes: {
      type: 'boolean',
      label: 'Skip Non-existing Attributes Flag',
      description:
        'Indicates whether to skip non-existing attributes. If `Yes`, the non-existing attributes are skipped and a 400 error is not returned. If `No`, a 400 error is returned in case of non-existing attributes.',
      default: false,
      required: false
    },
    profileId: { ...customerProfileId, required: false },
    couponCodes: {
      label: 'Coupon Codes',
      description: 'Any coupon codes entered. Up to 100 coupons.`',
      type: 'string',
      multiple: true
    },
    referralCode: {
      label: 'Referral Codes',
      description: 'Any referral code entered.`',
      type: 'string'
    },
    loyaltyCards: {
      label: 'Loyalty Cards',
      description: 'Any loyalty cards used. Up to 1 loyalty cards.`',
      type: 'string',
      multiple: true
    },
    state: {
      label: 'State',
      description: 'Indicates the current state of the session. `',
      type: 'string',
      choices: [
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
        { label: 'Partially returned', value: 'partially_returned' },
        { label: 'Cancelled', value: 'cancelled' }
      ]
    },
    cartItems: { ...cartItems },
    additionalCosts: {
      label: 'Additional Costs',
      description:
        'Use this property to set a value for the additional costs of this session, such as a shipping cost.`',
      type: 'object'
    },
    identifiers: {
      ...identifier,
      label: 'Identifiers'
    },
    attributes: {
      ...attribute,
      default: {
        '@path': '$.properties.attributes'
      },
      description:
        'Use this property to set a value for the attributes of your choice. Attributes represent any information to attach to your session, like the shipping city. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).'
    }
  },
  perform: (request, { payload }) => {
    let requestUrl = `https://integration.talon.one/segment/v2/customer_sessions/${payload.customerSessionId}`
    if (payload.skipNonExistingAttributes) {
      requestUrl += '?skipNonExistingAttributes=true'
    }
    return request(requestUrl, {
      method: 'put',
      headers: {
        'X-Callback-Destination-URI': `${payload.callbackDestination}`,
        'X-Callback-API-Key': `${payload.callbackAPIKey}`,
        'X-Content-Fields': `${payload.contentFields}`,
        'X-Correlation-ID': `${payload.callbackCorrelationId}`
      },
      json: {
        profileId: payload.profileId,
        couponCodes: payload.couponCodes,
        referralCode: payload.referralCode,
        loyaltyCards: payload.loyaltyCards,
        state: payload.state,
        cartItems: payload.cartItems,
        additionalCosts: payload.additionalCosts,
        identifiers: payload.identifiers,
        attributes: payload.attributes
      }
    })
  }
}

export default action
