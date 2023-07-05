import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { doPOST, getAuthCreds } from '../Utility/tablemaintutilities'
import get from 'lodash/get'
import { addUpdateEvents } from '../Utility/eventprocessing'
import { AuthTokens } from '@segment/actions-core/src/destination-kit/parse-settings'

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
    }
  },

  perform: async (request, { settings, payload, auth }) => {
    const email = get(payload, 'email', '')
    //Parse Event-Payload into an Update
    const rows = addUpdateEvents(payload, email, settings.attributesMax as number)

    let a_Auth = {}
    if (!auth?.accessToken) a_Auth = getAuthCreds()

    const POSTUpdates = `<Envelope>
      <Body>
        <InsertUpdateRelationalTable>
        <TABLE_ID>${settings.tableListId} </TABLE_ID>
          <ROWS>${rows}</ROWS>
        </InsertUpdateRelationalTable>
      </Body>
    </Envelope>`

    return await doPOST(request, settings, (auth as AuthTokens) ?? (a_Auth as AuthTokens), POSTUpdates, 'POST_Updates')
  }
}

export default action
