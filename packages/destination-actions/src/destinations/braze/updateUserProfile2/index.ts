import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { updateUserProfile, updateBatchedUserProfile } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update User Profile',
  description: "Update a user's profile attributes in Braze",
  defaultSubscription: 'type = "identify"',
  fields: {
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    user_alias: {
      label: 'User Alias Object',
      description:
        'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
      type: 'object',
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string'
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string'
        }
      }
    },
    braze_id: {
      label: 'Braze User Identifier',
      description: 'The unique user identifier',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.properties.braze_id'
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
        latitude: {
          label: 'Latitude',
          type: 'number'
        },
        longitude: {
          label: 'Longitude',
          type: 'number'
        }
      },
      default: {
        latitude: { '@path': '$.context.location.latitude' },
        longitude: { '@path': '$.context.location.longitude' }
      }
    },
    date_of_first_session: {
      label: 'Date of First Session',
      description: 'The date the user first used the app',
      type: 'datetime',
      allowNull: true
    },
    date_of_last_session: {
      label: 'Date of Last Session',
      description: 'The date the user last used the app',
      type: 'datetime',
      allowNull: true
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
    email_open_tracking_disabled: {
      label: 'Email Open Tracking Disabled',
      description:
        'Set to true to disable the open tracking pixel from being added to all future emails sent to this user.',
      type: 'boolean'
    },
    email_click_tracking_disabled: {
      label: 'Email Click Tracking Disabled',
      description: 'Set to true to disable the click tracking for all links within a future email, sent to this user.',
      type: 'boolean'
    },
    facebook: {
      label: 'Facebook Attribution Data',
      description:
        'Hash of Facebook attribution containing any of `id` (string), `likes` (array of strings), `num_friends` (integer).',
      type: 'object',
      properties: {
        id: {
          label: 'Facebook ID',
          type: 'string'
        },
        likes: {
          label: 'Facebook Likes',
          type: 'string',
          multiple: true
        },
        num_friends: {
          label: 'Facebook Number of Friends',
          type: 'integer'
        }
      }
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
      allowNull: true,
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
    last_name: {
      label: 'Last Name',
      description: "The user's last name",
      type: 'string',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    marked_email_as_spam_at: {
      label: 'Marked Email as Spam At',
      description: 'The date the user marked their email as spam.',
      type: 'datetime',
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
    },
    push_tokens: {
      label: 'Push Tokens',
      description:
        'Array of objects with app_id and token string. You may optionally provide a device_id for the device this token is associated with, e.g., [{"app_id": App Identifier, "token": "abcd", "device_id": "optional_field_value"}]. If a device_id is not provided, one will be randomly generated.',
      type: 'object',
      multiple: true,
      properties: {
        app_id: {
          label: 'App ID',
          description: 'The app identifier for the push token.',
          type: 'string',
          required: true
        },
        token: {
          label: 'Token',
          description: 'The push token.',
          type: 'string',
          required: true
        },
        device_id: {
          label: 'Device ID',
          description: 'Identifier for the device associated with this token',
          type: 'string'
        }
      }
    },
    time_zone: {
      label: 'Time zone',
      description:
        'The user’s time zone name from IANA Time Zone Database  (e.g., “America/New_York” or “Eastern Time (US & Canada)”). Only valid time zone values will be set.',
      type: 'string'
    },
    twitter: {
      label: 'Twitter Attribution Data',
      description:
        'Hash containing any of id (integer), screen_name (string, Twitter handle), followers_count (integer), friends_count (integer), statuses_count (integer).',
      type: 'object',
      properties: {
        id: {
          label: 'Twitter ID',
          type: 'string'
        },
        screen_name: {
          label: 'Twitter Handle',
          type: 'string'
        },
        followers_count: {
          label: 'Number of Followers',
          type: 'integer'
        },
        friends_count: {
          label: 'Number of Friends',
          type: 'integer'
        },
        statuses_count: {
          label: 'Number of Statuses',
          type: 'integer'
        }
      }
    },
    custom_attributes: {
      label: 'Custom Attributes',
      description: 'Hash of custom attributes to send to Braze',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    _update_existing_only: {
      label: 'Update Existing Only',
      description:
        'Setting this flag to true will put the API in "Update Only" mode. When using a "user_alias", "Update Only" mode is always true.',
      type: 'boolean',
      default: false
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Braze',
      description:
        'If true, Segment will batch events before sending to Braze’s user track endpoint. Braze accepts batches of up to 75 events.',
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 75,
      unsafe_hidden: true
    }
  },

  perform: (request, { settings, payload }) => {
    return updateUserProfile(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return updateBatchedUserProfile(request, settings, payload)
  }
}

export default action
