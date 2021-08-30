import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import appboy from '@braze/web-sdk'
import dayjs from '../../../lib/dayjs'

const action: BrowserActionDefinition<Settings, typeof appboy, Payload> = {
  title: 'Update User Profile',
  description: 'Updates a users profile attributes in Braze',
  defaultSubscription: 'type = "identify" or type = "group"',
  platform: 'web',
  fields: {
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    country: {
      label: 'Country',
      description: 'The country code of the user',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.location.country'
      }
    },
    current_location: {
      label: 'Current Location',
      description: "The user's current longitude/latitude.",
      type: 'object',
      allowNull: true,
      properties: {
        key: {
          label: 'Key',
          type: 'string',
          required: true
        },
        latitude: {
          label: 'Latitude',
          type: 'number',
          required: true
        },
        longitude: {
          label: 'Longitude',
          type: 'number',
          required: true
        }
      }
    },
    custom_attributes: {
      label: 'Custom Attributes',
      description:
        'Sets a custom user attribute. This can be any key/value pair and is used to collect extra information about the user.',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    dob: {
      label: 'Date of Birth',
      description: "The user's date of birth",
      type: 'datetime',
      allowNull: true
    },
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      format: 'email',
      allowNull: true,
      default: {
        '@path': '$.traits.email'
      }
    },
    email_subscribe: {
      label: 'Email Subscribe',
      description: `The user's email subscription preference: “opted_in” (explicitly registered to receive email messages), “unsubscribed” (explicitly opted out of email messages), and “subscribed” (neither opted in nor out).`,
      type: 'string'
    },
    first_name: {
      label: 'First Name',
      description: `The user's first name`,
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.firstName'
      }
    },
    last_name: {
      label: 'Last Name',
      description: "The user's last name",
      type: 'string',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    gender: {
      label: 'Gender',
      description:
        "The user's gender: “M”, “F”, “O” (other), “N” (not applicable), “P” (prefer not to say) or nil (unknown).",
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.gender'
      }
    },
    home_city: {
      label: 'Home City',
      description: "The user's home city.",
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.address.city'
      }
    },
    image_url: {
      label: 'Image URL',
      description: 'URL of image to be associated with user profile.',
      type: 'string',
      format: 'uri',
      default: {
        '@path': '$.traits.avatar'
      }
    },
    language: {
      label: 'Language',
      description: "The user's preferred language.",
      type: 'string',
      allowNull: true
    },
    phone: {
      label: 'Phone Number',
      description: "The user's phone number",
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.traits.phone'
      }
    },
    push_subscribe: {
      label: 'Push Subscribe',
      description: `The user's push subscription preference: “opted_in” (explicitly registered to receive push messages), “unsubscribed” (explicitly opted out of push messages), and “subscribed” (neither opted in nor out).`,
      type: 'string'
    }
  },

  perform: (client, { payload }) => {
    // TODO - addAlias / addToCustomAttributeArray?
    if (payload.external_id !== undefined) {
      client.changeUser(payload.external_id)
    }

    const user = client.getUser()

    payload.image_url !== undefined && user.setAvatarImageUrl(payload.image_url)
    payload.country !== undefined && user.setCountry(payload.country)

    payload.current_location?.key !== undefined &&
      user.setCustomLocationAttribute(
        payload.current_location.key,
        payload.current_location.latitude,
        payload.current_location.longitude
      )

    if (payload.dob !== undefined) {
      if (payload.dob === null) {
        user.setDateOfBirth(null, null, null)
      } else {
        const date = dayjs(payload.dob)
        user.setDateOfBirth(date.year(), date.month() + 1, date.date())
      }
    }

    // Adding `firstName` and `lastName` here as these fields are mapped using cammel_case.
    const reservedFields = [...Object.keys(action.fields), 'firstName', 'lastName']
    if (payload.custom_attributes !== undefined) {
      Object.entries(payload.custom_attributes).forEach(([key, value]) => {
        if (!reservedFields.includes(key)) {
          user.setCustomUserAttribute(key, value as string | number | boolean | Date | string[] | null)
        }
      })
    }

    payload.email_subscribe !== undefined &&
      user.setEmailNotificationSubscriptionType(payload.email_subscribe as appboy.User.NotificationSubscriptionTypes)

    payload.email !== undefined && user.setEmail(payload.email)
    payload.first_name !== undefined && user.setFirstName(payload.first_name)
    payload.gender !== undefined && user.setGender(toBrazeGender(payload.gender) as appboy.User.Genders)
    payload.home_city !== undefined && user.setHomeCity(payload.home_city)
    payload.language !== undefined && user.setLanguage(payload.language)
    payload.current_location !== undefined &&
      user.setLastKnownLocation(payload.current_location.latitude, payload.current_location.longitude)
    payload.last_name !== undefined && user.setLastName(payload.last_name)
    payload.phone !== undefined && user.setPhoneNumber(payload.phone)
    payload.push_subscribe !== undefined &&
      user.setPushNotificationSubscriptionType(payload.push_subscribe as appboy.User.NotificationSubscriptionTypes)
  }
}

function toBrazeGender(gender: string | undefined | null): string | null | undefined {
  if (!gender) {
    return gender
  }

  const genders: { [key: string]: string[] } = {
    M: ['man', 'male', 'm'],
    F: ['woman', 'female', 'w', 'f'],
    O: ['other', 'o'],
    U: ['u', 'unknown'],
    N: ['not applicable', 'n'],
    P: ['prefer not to say', 'p']
  }

  const brazeGender = Object.keys(genders).find((key) => genders[key].includes(gender.toLowerCase()))
  return brazeGender || gender
}

export default action
