import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { UPSERT_CONTACT_URL, TAG_CONTACT_URL, UNTAG_CONTACT_URL } from './contants'
import { UpsertContactJSON } from './types'
import { formatDate } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Sync Segment user profile details to Yonoma Contacts.',
  defaultSubscription: 'type = "identify"',
  fields: {
    identifiers: {
      label: 'Identifiers',
      type: 'object',
      description: 'Unique identifiers for the contact. At least one of userId or anonymousId is required.',
      required: true,
      properties: {
        userId: {
          label: 'User ID',
          type: 'string',
          description: 'Unique user identifier from your app.'
        },
        anonymousId: {
          label: 'Anonymous ID',
          type: 'string',
          description: 'Anonymous identifier from Segment for tracking pre-identified activity.'
        },
        email: {
          label: 'Email',
          type: 'string',
          description: "Contact's email address. Required if userId is not provided."
        }
      },
      default: {
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        email: { '@path': '$.traits.email' }
      }
    },
    listId: {
      label: 'List ID',
      type: 'string',
      description: "The Yonoma list to add the contact to.",
      required: true,
      default: { '@path': '$.traits.list_id' }
    },
    properties: {
      label: 'Contact Properties',
      type: 'object',
      description: 'Additional Contact metadata.',
      required: false,
      additionalProperties: false,
      defaultObjectUI: 'keyvalue',
      properties: {
        firstName: {
          label: 'First Name',
          type: 'string',
          description: "Contact's first name."
        },
        lastName: {
          label: 'Last Name',
          type: 'string',
          description: "Contact's last name."
        },
        phone: {
          label: 'Phone Number',
          type: 'string',
          description: "Contact's phone number."
        },
        dateOfBirth: {
          label: 'Date of Birth',
          type: 'string',
          description: "Contact's date of birth in YYYY-MM-DD or ISO8601 format."
        },
        address: {
          label: 'Address',
          type: 'string',
          description: "Contact's address."
        },
        city: {
          label: 'City',
          type: 'string',
          description: "Contact's city."
        },
        state: {
          label: 'State',
          type: 'string',
          description: "Contact's state or province."
        },
        country: {
          label: 'Country',
          type: 'string',
          description: "Contact's country."
        },
        zipcode: {
          label: 'Zip Code',
          type: 'string',
          description: "Contact's postal code."
        }
      },
      default: {
        firstName: { '@path': '$.traits.first_name' },
        lastName: { '@path': '$.traits.last_name' },
        phone: { '@path': '$.traits.phone' },
        dateOfBirth: { '@path': '$.traits.birthday' },
        address: { '@path': '$.traits.address.street' },
        city: { '@path': '$.traits.address.city' },
        state: { '@path': '$.traits.address.state' },
        country: { '@path': '$.traits.address.country' },
        zipcode: { '@path': '$.traits.address.zipcode' }
      }
    },
    status: {
      label: 'Email subscription status',
      type: 'boolean',
      description: 'Indicates if the Contact is subscribed or unsubscribed from marketing emails. Set to true to subscribe, false to unsubscribe.',
      required: true,
      default: true
    },
    tags_to_add: {
      label: 'Tags to Add',
      type: 'string',
      multiple: true,
      description: 'List of tags to add to the Contact. Can be a single string or array of tags. Tags must already exist in Yonoma.',
      required: false
    },
    tags_to_remove: {
      label: 'Tags to Remove',
      type: 'string',
      multiple: true,
      description: 'List of tags to remove from the Contact. Can be a single string or array of strings. Tags must already exist in Yonoma.',
      required: false
    }
  },
  perform: async (request, {payload}) => {
    const {
      listId,
      properties: {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        address,
        city,
        state,
        country,
        zipcode
      } = {},
      status,
      tags_to_add,
      tags_to_remove,
      identifiers: {
        userId,
        email,
        anonymousId
      } = {}
    } = payload

    if(!userId && !email && !anonymousId) {
      throw new PayloadValidationError('At least one identifier (userId, email, or anonymousId) is required.')
    }

    const jsonUpsertContact: UpsertContactJSON = {
      ...(userId ? { userId } : {}),
      ...(anonymousId ? { anonymousId } : {}),
      ...(email ? { email } : {}),
      listId,
      ...(typeof status === 'boolean' ? { status } : {}),
      properties: { 
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(phone ? { phone } : {}),
        ...(dateOfBirth ? { dateOfBirth: formatDate(dateOfBirth) } : {}),
        ...(address ? { address } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(country ? { country } : {}),
        ...(zipcode ? { zipcode } : {})
      }
    }

    await request(UPSERT_CONTACT_URL, {
      method: 'POST',
      json: jsonUpsertContact
    })

    if(typeof tags_to_add === 'string' || ( (Array.isArray(tags_to_add) && tags_to_add.length > 0))) {
      const jsonAddTags = {
        ...(userId ? { userId } : {}),
        ...(email ? { email } : {}),
        listId,
        tags: Array.isArray(tags_to_add) ? tags_to_add : [tags_to_add]
      }
      await request(TAG_CONTACT_URL, {
        method: 'POST',
        json: jsonAddTags
      })
    }

    if(typeof tags_to_remove === 'string' || ( (Array.isArray(tags_to_remove) && tags_to_remove.length > 0))) {
      const jsonRemoveTags = {
        ...(userId ? { userId } : {}),
        ...(email ? { email } : {}),
        listId,
        tags: Array.isArray(tags_to_remove) ? tags_to_remove : [tags_to_remove]
      }
      await request(UNTAG_CONTACT_URL, {
        method: 'POST',
        json: jsonRemoveTags
      })
    }
  
  }
}

export default action
