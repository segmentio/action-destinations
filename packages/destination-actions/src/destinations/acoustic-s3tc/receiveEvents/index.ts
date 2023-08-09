// import type { ActionDefinition } from '@segment/actions-core'

// import { ActionDefinition } from '@segment/actions-core'
import { ActionDefinition, RequestClient, PayloadValidationError } from '@segment/actions-core'

/* 

ReceiveEvents

*/

// import type { Settings } from '../SetAside/generated-types'
// import type { Payload } from '../SetAside/receiveEvents/generated-types'

import { Settings } from '../generated-types'
import { Payload } from '../receiveEvents/generated-types'
import { uploadS3, validateS3 } from '../Utility/sendS3'
import { uploadSFTP, validateSFTP, Client as ClientSFTP } from '../Utility/sendSFTP'
import { buildFile } from '../SetAside/operations'

// import { doPOST } from '../Utility/tablemaintutilities'
// import get from 'lodash/get'
// import { addUpdateEvents } from '../Utility/eventprocessing'
// import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Receive Track and Identify Events',
  description: 'Provide Segment Track and Identify Event Data to Acoustic Campaign',
  fields: {
    email: {
      label: 'Email',
      description: 'At a minimum Email is required, see mapping presets for more info.',
      type: 'string',
      format: 'email',
      required: true,
      default: {
        '@path': '$.email'
      }
    },
    type: {
      label: 'Type',
      description: 'The Event Type, will be either Track or Identify',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The Timestamp of the Event',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    // audience: {
    //   label: 'Audience identification attributes (Optional)',
    //   description: 'Map Audience identification attributes here. For Identify Events, mapping must provide at least "computation_class" and "computation_key" attributes, for Track events, mapping must provide "audience_key"',
    //   type: 'object'
    // },
    key_value_pairs: {
      label: 'Key-Value pairs',
      description: 'Map simple Key-Value pairs of Event data here.',
      type: 'object'
    },
    array_data: {
      label: 'Arrays',
      description: 'Map Arrays of data into flattened data attributes here.',
      type: 'object',
      multiple: true,
      additionalProperties: true
    },
    context: {
      label: 'Context',
      description: 'All properties provided via a Context Section ',
      type: 'object'
      // default: {
      //   '@path': '$.context'
      // }
    },
    properties: {
      label: 'Properties',
      description: 'All properties provided via a Properties Section',
      type: 'object'
      // // default: {
      //   '@path': '$.properties'
      // }
    },
    traits: {
      label: 'Traits',
      description: 'All properties provided via a Traits Section',
      type: 'object'
      // default: {
      //   '@path': '$.traits'
      // }
    },

    //Explore these interesting settings
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'Receive events in bulk payload',
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch.',
      type: 'number',
      required: false,
      default: 100
    }
  },
  perform: async (request, { settings, payload }) => {
    PayloadValidationError

    return processData(request, settings, [payload])
  },
  performBatch: (request, { settings, payload }) => {
    return processData(request, settings, payload)
  }
}

async function processData(request: RequestClient, settings: Settings, payloads: Payload[]) {
  const { filename, fileContent } = buildFile(payloads)
  if (settings.tcSend === 'S3') {
    validateS3(settings)
    return uploadS3(settings, filename, fileContent, request)
  }
  if (settings.tcSend === 'SFTP') {
    validateSFTP(settings)
    const sftpClient = new ClientSFTP()
    return uploadSFTP(sftpClient, settings, filename, fileContent)
  }
}

export default action
