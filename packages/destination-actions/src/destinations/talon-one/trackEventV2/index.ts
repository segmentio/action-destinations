import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { attribute, customerProfileId } from '../t1-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track event',
  description:
    'This records a custom event in Talon.One. Create the event and all the required attributes before using this endpoint.',
  fields: {
    skipNonExistingAttributes: {
      type: 'boolean',
      label: 'Skip Non-existing Attributes Flag',
      description:
        'Indicates whether to skip non-existing attributes. If `Yes`, the non-existing attributes are skipped and a 400 error is not returned. If `No`, a 400 error is returned in case of non-existing attributes.',
      default: false,
      required: false
    },
    customerProfileId: {
      ...customerProfileId,
      description:
        'The customer profile integration ID to use in Talon.One. It is the identifier of the customer profile associated to the event.'
    },
    eventType: {
      label: 'Event Type',
      description: 'The name of the event sent to Talon.One.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    attributes: {
      ...attribute,
      default: {
        '@path': '$.properties.attributes'
      },
      description:
        'Extra attributes associated with the event. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).'
    }
  },
  perform: (request, { payload }) => {
    let requestUrl = `https://integration.talon.one/segment/v2/events`
    if (payload.skipNonExistingAttributes) {
      requestUrl += '?skipNonExistingAttributes=true'
    }
    return request(requestUrl, {
      method: 'put',
      json: {
        customerProfileId: payload.customerProfileId,
        eventType: payload.eventType,
        eventAttributes: payload.attributes
      }
    })
  }
}

export default action
