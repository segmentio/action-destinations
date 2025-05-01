import type { ActionDefinition, DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { API_URL } from '../config'
import { PayloadValidationError } from '@segment/actions-core'
import { KlaviyoAPIError, ProfileData } from '../types'
import {
  addProfileToList,
  createImportJobPayload,
  getListIdDynamicData,
  sendImportJobRequest,
  getList,
  createList,
  groupByListId,
  processProfilesByGroup,
  validateAndConvertPhoneNumber,
  processPhoneNumber
} from '../functions'
import { batch_size, country_code } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile',
  description: 'Upsert user profile.',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      label: 'Email',
      description: `Individual's email address. One of External ID, Phone Number and Email required.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Klaviyo',
      description: 'When enabled, the action will use the klaviyo batch API.'
    },
    phone_number: {
      label: 'Phone Number',
      description: `Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.`,
      type: 'string',
      default: { '@path': '$.context.traits.phone' }
    },
    country_code: {
      ...country_code
    },
    external_id: {
      label: 'External ID',
      description: `A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID, Phone Number and Email required.`,
      type: 'string'
    },
    first_name: {
      label: 'First Name',
      description: `Individual's first name.`,
      type: 'string',
      default: { '@path': '$.traits.firstName' }
    },
    last_name: {
      label: 'Last Name',
      description: `Individual's last name.`,
      type: 'string',
      default: { '@path': '$.traits.lastName' }
    },
    organization: {
      label: 'Organization',
      description: `Name of the company or organization within the company for whom the individual works.`,
      type: 'string',
      default: { '@path': '$.traits.company.name' }
    },
    title: {
      label: 'Title',
      description: `Individual's job title.`,
      type: 'string',
      default: { '@path': '$.traits.title' }
    },
    image: {
      label: 'Image',
      description: `URL pointing to the location of a profile image.`,
      type: 'string',
      default: { '@path': '$.traits.avatar' }
    },
    location: {
      label: 'Location',
      description: `Individual's address.`,
      type: 'object',
      properties: {
        address1: {
          label: 'Address 1',
          type: 'string',
          allowNull: true
        },
        address2: {
          label: 'Address 2',
          type: 'string',
          allowNull: true
        },
        city: {
          label: 'City',
          type: 'string',
          allowNull: true
        },
        region: {
          label: 'Region',
          type: 'string',
          allowNull: true
        },
        zip: {
          label: 'ZIP',
          type: 'string',
          allowNull: true
        },
        latitude: {
          label: 'Latitude',
          type: 'string',
          allowNull: true
        },
        longitude: {
          label: 'Longitide',
          type: 'string',
          allowNull: true
        },
        country: {
          label: 'Country',
          type: 'string',
          allowNull: true
        }
      },
      default: {
        city: { '@path': '$.traits.address.city' },
        region: { '@path': '$.traits.address.state' },
        zip: { '@path': '$.traits.address.postal_code' },
        address1: { '@path': '$.traits.address.street' },
        country: { '@path': '$.traits.address.country' }
      }
    },
    properties: {
      description: 'An object containing key/value pairs for any custom properties assigned to this profile.',
      label: 'Properties',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    list_id: {
      label: 'List',
      description: `The Klaviyo list to add the profile to.`,
      type: 'string',
      dynamic: true
    },
    batch_size: { ...batch_size },
    override_list_id: {
      unsafe_hidden: true,
      label: 'List ID Override',
      description:
        'Klaviyo list ID to override the default list ID when provided in an event payload. Added to support backward compatibility with klaviyo(classic) and facilitate a seamless migration.',
      type: 'string',
      default: { '@path': '$.integrations.Klaviyo.listId' }
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['list_id', 'override_list_id']
    }
  },
  hooks: {
    retlOnMappingSave: {
      label: 'Connect to a static list in Klaviyo',
      description: 'When saving this mapping, we will connect to a list in Klaviyo.',
      inputFields: {
        list_identifier: {
          type: 'string',
          label: 'Existing List ID',
          description:
            'The ID of the list in Klaviyo that users will be synced to. If defined, we will not create a new list.',
          required: false,
          dynamic: async (request) => {
            return getListIdDynamicData(request)
          }
        },
        list_name: {
          type: 'string',
          label: 'Name of list to create',
          description: 'The name of the list that you would like to create in Klaviyo.',
          required: false
        }
      },
      outputTypes: {
        id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the created Klaviyo list that users will be synced to.',
          required: false
        },
        name: {
          type: 'string',
          label: 'List Name',
          description: 'The name of the created Klaviyo list that users will be synced to.',
          required: false
        }
      },
      performHook: async (request, { settings, hookInputs }) => {
        if (hookInputs.list_identifier) {
          try {
            return getList(request, settings, hookInputs.list_identifier)
          } catch (e) {
            const message = (e as IntegrationError).message || JSON.stringify(e) || 'Failed to get list'
            const code = (e as IntegrationError).code || 'GET_LIST_FAILURE'
            return {
              error: {
                message,
                code
              }
            }
          }
        }
        try {
          return createList(request, settings, hookInputs.list_name)
        } catch (e) {
          const message = (e as IntegrationError).message || JSON.stringify(e) || 'Failed to create list'
          const code = (e as IntegrationError).code || 'CREATE_LIST_FAILURE'
          return {
            error: {
              message,
              code
            }
          }
        }
      }
    }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload, hookOutputs }) => {
    const {
      email,
      external_id,
      phone_number: initialPhoneNumber,
      enable_batching,
      batch_size,
      list_id: otherListId,
      override_list_id,
      country_code,
      batch_keys,
      ...otherAttributes
    } = payload

    const list_id = hookOutputs?.retlOnMappingSave?.outputs?.id ?? override_list_id ?? otherListId

    const phone_number = processPhoneNumber(initialPhoneNumber, country_code)

    if (!email && !phone_number && !external_id) {
      throw new PayloadValidationError('One of External ID, Phone Number and Email is required.')
    }

    const profileData: ProfileData = {
      data: {
        type: 'profile',
        attributes: {
          email,
          external_id,
          phone_number,
          ...otherAttributes
        }
      }
    }

    try {
      const profile = await request(`${API_URL}/profiles/`, {
        method: 'POST',
        json: profileData
      })
      if (list_id) {
        const content = JSON.parse(profile?.content)
        const id = content.data.id
        await addProfileToList(request, id, list_id)
      }
      return profile
    } catch (error) {
      const { response } = error as KlaviyoAPIError

      if (response?.status === 409) {
        const content = JSON.parse(response?.content)
        const id = content?.errors[0]?.meta?.duplicate_profile_id

        if (id) {
          profileData.data.id = id

          const profile = await request(`${API_URL}/profiles/${id}`, {
            method: 'PATCH',
            json: profileData
          })

          if (list_id) {
            await addProfileToList(request, id, list_id)
          }
          return profile
        }
      }

      throw error
    }
  },

  performBatch: async (request, { payload, hookOutputs, statsContext }) => {
    payload = payload.filter((profile) => {
      // Validate and convert the phone number using the provided country code
      const validPhoneNumber = validateAndConvertPhoneNumber(profile.phone_number, profile.country_code)

      // If the phone number is valid, update the profile's phone number with the validated format
      if (validPhoneNumber) {
        profile.phone_number = validPhoneNumber
      }
      // If the phone number is invalid (null), exclude this profile
      else if (validPhoneNumber === null) {
        return false
      }
      return profile.email || profile.phone_number || profile.external_id
    })

    if (statsContext) {
      const { tags, statsClient } = statsContext
      const set = new Set()
      payload.forEach((x) => set.add(`${x.list_id}-${x.override_list_id}`))
      statsClient?.histogram('actions-klaviyo.remove_profile_from_list.unique_list_id', set.size, tags)
    }

    const profilesWithList: Payload[] = []
    const profilesWithoutList: Payload[] = []

    payload.forEach((profile) => {
      if (hookOutputs?.retlOnMappingSave?.outputs?.id) {
        profile.list_id = hookOutputs.retlOnMappingSave.outputs.id
      }
      if (profile.list_id || profile.override_list_id) {
        profilesWithList.push(profile)
      } else {
        profilesWithoutList.push(profile)
      }
    })

    let importResponseWithList
    let importResponseWithoutList

    if (profilesWithList.length > 0) {
      // Group profiles based on list_id
      const groupedByListId = groupByListId(profilesWithList)
      importResponseWithList = await processProfilesByGroup(request, groupedByListId)
    }

    if (profilesWithoutList.length > 0) {
      const importJobPayload = createImportJobPayload(profilesWithoutList)
      importResponseWithoutList = await sendImportJobRequest(request, importJobPayload)
    }

    return {
      withList: importResponseWithList,
      withoutList: importResponseWithoutList
    }
  }
}

export default action
