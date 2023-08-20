import { ActionDefinition, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from '../receiveEvents/generated-types'
import get from 'lodash/get'
import { addUpdateEvents } from './eventprocessing'
import generateS3RequestOptions from '../../../lib/AWS/s3'
import { validateSettings } from './preCheck'

/* 
ReceiveEvents 
*/

const action: ActionDefinition<Settings, Payload> = {
  title: 'Receive Events',
  description: 'Provide Segment Track and Identify Event Data to Acoustic Campaign',
  fields: {
    email: {
      label: 'Email',
      description: 'Do Not Modify - Email is required',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@path': '$.email'
      }
    },
    type: {
      label: 'Type',
      description: 'Do Not Modify - Event Type is required',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Do Not Modify - Timestamp of the Event is required',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    explanatory: {
      label: 'Mapping Aides: ',
      description: 'Use at least one to Map data to Acoustic',
      type: 'text',
      default:
        'The following Mapping options are provided as an aide to Mapping Data. \nAlthough all are optional, use at least one to map data that you want to send to Acoustic.'
    },
    key_value_pairs: {
      label: 'Optional - Key-Value pairs',
      description: 'As an aide you can use this section to Map simple Key-Value pairs from the Event',
      type: 'object'
    },
    array_data: {
      label: 'Optional - Arrays',
      description: 'If the data needed is in an array, use this section to Map Array data into useable attributes',
      type: 'object',
      multiple: true,
      additionalProperties: true
    },
    context: {
      label: 'Optional - Context',
      description: 'If the data is present in a Context section, use this to pick all attributes of a Context Section',
      type: 'object'
      // default: {
      //   '@path': '$.context'
      // }
    },
    properties: {
      label: 'Optional - Properties',
      description:
        'If the data is present in a Properties section, use this to pick all attributes in the Properties Section',
      type: 'object'
      // // default: {
      //   '@path': '$.properties'
      // }
    },
    traits: {
      label: 'Optional - Traits',
      description: 'If the data is present in a Traits section, use this to pick all attributes in the Traits Section',
      type: 'object'
      // default: {
      //   '@path': '$.traits'
      // }
    }
  },
  perform: async (request, { settings, payload }) => {
    const email = get(payload, 'email', '')

    if (!email) {
      throw new IntegrationError('Email Not Found, invalid Event received.', 'INVALID_EVENT_HAS_NO_EMAIL', 400)
    }

    validateSettings(settings)

    //Parse Event-Payload into an Update
    const csvRows = addUpdateEvents(payload, email)

    //Set File Store Name
    const fileName = settings.fileNamePrefix + `${new Date().toISOString().replace(/(\.|-|:)/g, '_')}` + '.csv'

    const method = 'PUT'
    const opts = await generateS3RequestOptions(
      settings.s3_bucket as string,
      settings.s3_region as string,
      fileName,
      method,
      csvRows,
      settings.s3_access_key as string,
      settings.s3_secret as string
    )
    if (!opts.headers || !opts.method || !opts.host || !opts.path) {
      throw new InvalidAuthenticationError('Unable to generate signature header for AWS S3 request.')
    }

    return await request(`https://${opts.host}/${opts.path}`, {
      headers: opts.headers as Record<string, string>,
      method,
      body: opts.body
    })
  }
}
export default action
