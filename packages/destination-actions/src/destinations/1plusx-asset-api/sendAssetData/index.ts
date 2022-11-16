import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import mapValues from 'lodash/mapValues'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Asset Data',
  description: 'Send Asset data into 1PlusX',
  fields: {
    //A user identifier must be in the form IDSPACE:ID, i.e. idfa:6D92078A-8246-4BA4-AE5B-76104861E7DC
    asset_uri: {
      label: 'Asset ID',
      description: "The asset's unique identifier",
      type: 'string',
      required: true,
      default: {
        '@template': 'ASSETnamespace:ASSETid'
      }
    },
    ope_title: {
      label: 'Asset Title',
      description: 'User friendly description of the asset in the UI',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.title'
      }
    },
    ope_content: {
      label: 'Asset Content',
      description: 'Textual content of the asset processing using NLP alogrithms',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.content'
      }
    },
    custom_fields: {
      label: 'Custom Fields',
      description: 'Custom fields to include with the event',
      type: 'object'
    }
  },
  perform: (request, { settings, payload }) => {
    //Create cleanPayload with custom_fields and asset_uri
    //Removed custom_fields as these must be unnested
    //Removed asset_uri as it should only be used as a part of the API endpoint and not the outgoing payload
    const { custom_fields, asset_uri, ...cleanPayload } = payload

    //Convert custom_field values to strings as per 1plusX requirements
    const cleanProps = mapValues(custom_fields, function (value) {
      //Drop arrays and objects
      // TODO still must include Date!
      if (typeof value === 'object' && !(value instanceof Array) && !(value instanceof Date)) return
      //Pass strings straight through
      else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
      //Otherwise stringify all other data types
      else if (value instanceof Array) return value
      else return JSON.stringify(value)
    })

    const endpoint = encodeURI(
      `https://${settings.client_name}.assets.tagger.opecloud.com/v2/native/asset/${payload.asset_uri}`
    )

    return request(endpoint, {
      method: 'put',
      json: {
        ...cleanPayload,
        ...cleanProps
      }
    })
  }
}
export default action
