import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// It needs to carry the "profile" suffix on every key.
// This makes it specific to Adobe Target
// Needs support for nested keys
const attributes: { [x: string]: any } = {}
function getnestedObjects(obj: { [x: string]: any }, objectPath = '') {
  if (obj.traits) {
    obj = obj.traits
  }
  Object.keys(obj).forEach((key) => {
    const currObjectPath = objectPath ? `${objectPath}.${key}` : key
    if (typeof obj[key] !== 'object' && obj[key]) {
      attributes[currObjectPath] = obj[key].toString()
    } else {
      getnestedObjects(obj[key], currObjectPath)
    }
  })
  return attributes
}
const objectToQueryString = (object: { [x: string]: { toString: () => any } }) =>
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
    },
    traits: {
      label: 'Traits',
      description: "The user's attributes that will be updated.",
      type: 'object',
      required: true,
      default: {
        '@path': '$.properties.traits'
      }
    }
  },

  perform: (request, data) => {
    const array: unknown[] = []
    Object.entries(data.payload).forEach((entry) => array.push(entry[1]))
    const clientCode = data.settings.client_code
    const userId = data.payload.user_id
    const traits = getnestedObjects(data.payload.traits)
    const requestUrl = `https://${clientCode}.tt.omtrdc.net/m2/${clientCode}/profile/update?mbox3rdPartyId=${userId}&${objectToQueryString(
      traits
    )}`

    return request(requestUrl, {
      method: 'POST'
    })
  }
}

export default action
