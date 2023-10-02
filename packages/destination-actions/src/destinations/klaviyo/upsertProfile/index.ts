import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { API_URL } from '../config'
import { IntegrationError } from '@segment/actions-core'
import { KlaviyoAPIError, ProfileData } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile',
  description: 'Upsert user profile.',
  fields: {
    email: {
      label: 'Email',
      description: `Individual's email address. One of External ID, Phone Number and Email required.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    phone_number: {
      label: 'Phone Number',
      description: `Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.`,
      type: 'string',
      default: { '@path': '$.context.traits.phone' }
    },
    external_id: {
      label: 'External ID',
      description: `A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system.`,
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
    }
  },
  perform: async (request, { payload }) => {
    const { email, external_id, phone_number, ...otherAttributes } = payload

    if (!email && !phone_number && !external_id) {
      throw new IntegrationError(
        'One of External ID, Phone Number and Email is required.',
        'Missing required fields',
        400
      )
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
          return profile
        }
      }

      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
