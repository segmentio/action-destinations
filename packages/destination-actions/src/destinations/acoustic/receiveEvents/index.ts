import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { doPOST, preChecksAndMaint, getAuthCreds } from '../Utility/tablemaintutilities'
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
    key_value_pairs: {
      label: 'Key value pairs',
      description: 'Map simple Key-Value pairs of data to here.',
      type: 'object'
    },
    array_data: {
      label: 'Array of things',
      description: 'Map Arrays of data to here.',
      type: 'object',
      multiple: true,
      additionalProperties: true
    }
    // context: {
    //   label: 'Context',
    //   description: 'Parses all properties provided via a Context Section ',
    //   type: 'object',
    //   default: {
    //     '@path': '$.context'
    //   }
    // },
    // properties: {
    //   label: 'Properties',
    //   description: 'Parses all properties provided via a Properties Section',
    //   type: 'object',
    //   default: {
    //     '@path': '$.properties'
    //   }
    // },
    // traits: {
    //   label: 'Traits',
    //   description: 'Parses all properties provided via a Traits Section',
    //   type: 'object',
    //   default: {
    //     '@path': '$.traits'
    //   }
    // },
  },

  perform: async (request, { settings, payload, auth }) => {
    const email = get(payload, 'email', '')

    const tableId = await preChecksAndMaint(request, settings, auth as AuthTokens)

    //Ok, prechecks and Maint are all accomplished, let's see what needs to be processed,
    const rows = addUpdateEvents(payload, email, settings.attributesMax as number)

    let a_Auth = {}
    if (!auth) a_Auth = getAuthCreds()

    const POSTUpdates = `<Envelope>
      <Body>
        <InsertUpdateRelationalTable>
        <TABLE_ID>${tableId} </TABLE_ID>
          <ROWS>${rows}</ROWS>
        </InsertUpdateRelationalTable>
      </Body>
    </Envelope>`

    return await doPOST(request, settings, (auth as AuthTokens) ?? (a_Auth as AuthTokens), POSTUpdates, 'POST_Updates')
  }
}

export default action
