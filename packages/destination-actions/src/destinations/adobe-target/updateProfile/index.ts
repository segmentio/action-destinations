import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// It needs to carry the "profile" suffix on every key.
// This makes it specific to Adobe Target
// Needs support for nested keys
const objectToQueryString = (object) =>
  Object.keys(object)
    .map((key) => `profile.${key}=${object[key].toString()}`)
    .join('&')

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Profile',
  description: '',
  fields: {
    user_id: {
      label: 'User ID',
      description: "The user's unique identifier",
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (request, data) => {
    // TODO:
    // - Support conversion of nested objects into query string params
    // - Properly parse user traits. How do traits work and how to read from them?
    // - Add tests. Check actions document for more info
    // - Test cases:
    //    - Update user with PCID:
    //      - Update nested and not nested objects
    //    - Update user with MBOXID
    //      - Update nested and not nested objects
    // How to update generated types so id_type isn't an editor error

    const clientCode = data.settings.client_id
    const idType = data.settings.id_type === 'mbox3rdPartyId' ? 'mbox3rdPartyId' : 'mboxPC'

    const userId = data.payload.user_id
    const attributes = data.traits // This needs to be update so it doesnt use rawData

    const requestUrl = `https://${clientCode}.tt.omtrdc.net/m2/${clientCode}/profile/update?${idType}=${userId}&${objectToQueryString(
      attributes
    )}`

    console.log(requestUrl)

    return request(requestUrl, {
      method: 'POST'
    })
  }
}

export default action
