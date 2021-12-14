import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'
import { commonFields } from "../common-fields";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Page View',
  description: 'Send a page view event to Gainsight PX',
  defaultSubscription: 'type = "page"',
  fields: {
    name: {
      label: 'Page Name',
      type: 'string',
      allowNull: true,
      required: true,
      description: 'The name of the page',
      default: {
        '@path': '$.name'
      }
    },
    properties: {
      label: 'Page Properties',
      type: 'object',
      description: 'Page Properties',
      required: true,
      properties: {
        url: {
          label: 'Page Url',
          type: 'string'
        },
        title: {
          label: 'Page Title',
          type: 'string'
        },
        referrer: {
          label: 'Page Referrer',
          type: 'string'
        },
        path: {
          label: 'Path portion of the current page URL',
          type: 'string'
        }
      },
      default: {
        url: { '@path': '$.properties.url' },
        title: { '@path': '$.properties.title' },
        referrer: { '@path': '$.properties.referrer' },
        path: { '@path': '$.properties.path' }
      }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {

    return request(getEndpointByRegion('track', settings.dataCenter), {
      method: 'post',
      json: payload
    })
  }
}

export default action
