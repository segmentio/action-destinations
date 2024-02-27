import { ActionDefinition, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from '../receiveEvents/generated-types'
import get from 'lodash/get'
import { addUpdateEvents } from './eventprocessing'
import generateS3RequestOptions from '../../../lib/AWS/s3'
import { validateSettings } from './preCheck'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Events',
  description:
    'Send Segment identify() and track() events to Acoustic Connect. At least one of the following optional fields should be populated: Key-Value pairs, Arrays, Context, Properties, Traits.',
  fields: {
    key_value_pairs: {
      label: 'Key-Value pairs',
      description: 'Map simple Key-Value pairs (optional) ',
      type: 'object'
    },
    array_data: {
      label: 'Arrays',
      description:
        'If the data needed is in an array, use this section to Map Array data into useable attributes (optional) ',
      type: 'object',
      multiple: true,
      additionalProperties: true
    },
    context: {
      label: 'Context',
      description:
        'If the data is present in a Context section, use this to map the attributes of a Context Section (optional)',
      type: 'object'
    },
    properties: {
      label: 'Properties',
      description:
        'If the data is present in a Properties section, use this to map the attributes of a Properties Section (optional) ',
      type: 'object'
    },
    traits: {
      label: 'Traits',
      description:
        'If the data is present in a Traits section, use this to map the attributes of a Traits Section (optional) ',
      type: 'object'
    },
    email: {
      label: 'Email',
      description: 'Do Not Modify - Email is required',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    type: {
      label: 'Type',
      description: 'Do Not Modify - The type of event. e.g. track or identify, this field is required',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Do Not Modify - The timestamp for when the event took place. This field is required',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const email = get(payload, 'email', '')

    if (!email) {
      throw new IntegrationError('Email Not Found, invalid Event received.', 'INVALID_EVENT_HAS_NO_EMAIL', 400)
    }

    if (!payload.context && !payload.traits && !payload.properties)
      throw new IntegrationError(
        'No mapped data provided, must use at least one of the mapping fields to define the data to be sent to Acoustic.',
        'INVALID_NO_DATA_MAPPED',
        400
      )

    validateSettings(settings)

    //Parse Event-Payload into an Update
    const csvRows = addUpdateEvents(payload, email)

    //Set File Store Name
    const fileName = settings.fileNamePrefix + `${new Date().toISOString().replace(/(\.|-|:)/g, '_')}` + '.csv'

    const method = 'PUT'
    const opts = await generateS3RequestOptions(
      settings.s3_bucket_accesspoint_alias,
      settings.s3_region,
      fileName,
      method,
      csvRows,
      settings.s3_access_key,
      settings.s3_secret
    )
    if (!opts.headers || !opts.method || !opts.host || !opts.path) {
      throw new InvalidAuthenticationError('Unable to generate correct signature header for AWS S3 Put request.')
    }

    return await request(`https://${opts.host}/${opts.path}`, {
      headers: opts.headers as Record<string, string>,
      method,
      body: opts.body
    })
  }
}
export default action
