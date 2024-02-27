import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { OrderPlacedBody } from '../utils'
import { EventEndpoint, EventTypeId } from '../utils'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Order Placed',
  description: 'Track when an order is placed.',
  defaultSubscription: 'type = "track"',

  fields: {
    DateCreated: {
      label: 'Timestamp',
      description: 'Date of cart creation. Default to current date and time.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    OrderNumber: {
      label: 'Order Number',
      description: 'Order number from e-commerce platform.',
      type: 'string',
      default: {
        '@path': '$.properties.OrderNumber'
      }
    },
    SourceId: {
      label: 'Order ID',
      description: 'Order id from e-commerce platform (same as checkout id).',
      type: 'string',
      default: {
        '@path': '$.properties.SourceId'
      }
    },
    TokenId: {
      label: 'Token ID',
      description: 'A reference to the order that is a string value.',
      type: 'string',
      default: {
        '@path': '$.properties.TokenId'
      }
    },
    CustomerId: {
      label: 'Customer ID',
      description: 'Customer ID from e-commerce platform.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.CustomerId'
      }
    },
    Url: {
      label: 'Order URL',
      description: 'Link for user to click on to see status.',
      type: 'string',
      format: 'uri',
      required: true,
      default: {
        '@path': '$.properties.Url'
      }
    },
    OrderTotal: {
      label: 'Order Total',
      description: 'Total Order Value.',
      type: 'number',
      required: true,
      default: {
        '@path': '$.properties.OrderTotal'
      }
    },
    TotalSpent: {
      label: 'Total Spent',
      description: 'Total customer lifetime spend.',
      type: 'number',
      required: true,
      default: {
        '@path': '$.properties.TotalSpent'
      }
    },
    FirstName: {
      label: 'First name',
      description: "Customer's first name.",
      type: 'string',
      default: {
        '@path': '$.properties.FirstName'
      }
    },
    lastName: {
      label: 'Last name',
      description: "Customer's last name.",
      type: 'string',
      default: {
        '@path': '$.properties.lastName'
      }
    },
    Phone: {
      label: 'Phone number',
      description: "Customer's phone number.",
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.Phone'
      }
    },
    Email: {
      label: 'Email',
      description: "Customer's email address",
      type: 'string',
      format: 'email',
      default: {
        '@path': '$.properties.Email'
      }
    },
    Zip: {
      label: 'Zip code',
      description: "Customer's postal code",
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.Zip'
      }
    },
    LastUpdated: {
      label: 'Last Updated',
      description: 'The date and time when the updates interacted with.',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    ProductImageUrl: {
      label: 'Product Image URL',
      description: 'URL with product image.',
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.properties.ProductImageUrl'
      }
    },
    LinkReference: {
      label: 'Link reference',
      description: 'Used as a key to link events together.',
      type: 'string',
      default: {
        '@path': '$.properties.LinkReference'
      }
    },
    HomepageUrl: {
      label: 'Homepage URL',
      description: "URL of the tenant's e-commerce homepage.",
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.properties.HomepageUrl'
      }
    }
  },

  perform: (request, { payload }) => {
    const body: OrderPlacedBody = {
      eventTypeId: EventTypeId,
      phone: payload.Phone,
      eventMeta: payload
    }
    return request(EventEndpoint, { method: 'POST', json: body })
  }
}

export default action
