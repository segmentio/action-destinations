import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { endpoints, playerProperties, sendRequest } from '../util'
import type { Payload } from './generated-types'

const mapPayload = (payload: Payload) => {
  const object = {
    playerUniqueId: payload.playerUniqueId,
    mobile: payload.mobile,
    email: payload.email,
    playerCustomAttributes: payload.playerCustomAttributes,
    referrerCode: payload.referrerCode,
    levelOrder: payload.levelOrder,
    deviceToken: payload.deviceToken,
    playerAttributes: { ...payload }
  }

  if (object.playerAttributes.preferredLanguage) {
    object.playerAttributes.preferredLanguage = object.playerAttributes.preferredLanguage.split('-')[0]
  }
  if (object.playerAttributes.displayName) {
    const display = object.playerAttributes.displayName.split(' ')
    if (display.length > 1) {
      object.playerAttributes.firstName = display.slice(0, -1).join(' ')
      object.playerAttributes.lastName = display.slice(-1).join(' ')
    } else {
      object.playerAttributes.firstName = display[0]
    }
  } else if (object.playerAttributes.firstName || object.playerAttributes.lastName) {
    object.playerAttributes.firstName ??= ''
    object.playerAttributes.lastName ??= ''
    object.playerAttributes.displayName =
      `${object.playerAttributes.firstName} ${object.playerAttributes.lastName}`.trim()
  }

  return object
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Player',
  description: 'This Action used to create or update a player in Gameball with the provided attributes.',
  defaultSubscription: 'type = "identify"',

  fields: {
    ...playerProperties,
    displayName: {
      label: 'Display Name',
      type: 'string',
      description: `Player's display name`,
      default: {
        '@path': '$.traits.displayName'
      }
    },
    firstName: {
      label: 'First Name',
      type: 'string',
      description: `Player's first name`,
      default: {
        '@path': '$.traits.first_name'
      }
    },
    lastName: {
      label: 'Last Name',
      type: 'string',
      description: `Player's last name`,
      default: {
        '@path': '$.traits.last_name'
      }
    },
    gender: {
      label: 'Gender',
      type: 'string',
      description: `Player's gender.`,
      default: {
        '@path': '$.traits.gender'
      }
    },
    dateOfBirth: {
      label: 'Date Of Birth',
      type: 'datetime',
      description: `Player's date of birth`,
      default: {
        '@path': '$.traits.birthday'
      }
    },
    joinDate: {
      label: 'Join Date',
      type: 'datetime',
      description: `Player's join date at your system.`,
      default: {
        '@path': '$.traits.joinDate'
      }
    },
    country: {
      label: 'Country',
      type: 'string',
      description: `Player's country.`,
      default: {
        '@path': '$.traits.address.country'
      }
    },
    city: {
      label: 'City',
      type: 'string',
      description: `Player's city`,
      default: {
        '@path': '$.traits.address.city'
      }
    },
    zip: {
      label: 'Zip code',
      type: 'string',
      description: `Player's zip code`,
      default: {
        '@path': '$.traits.location.postalCode'
      }
    },
    preferredLanguage: {
      label: 'Preferred language',
      type: 'string',
      description: `Player's preferred language`,
      default: {
        '@path': '$.context.locale'
      }
    },
    guest: {
      label: 'Guest',
      type: 'boolean',
      description: `A boolean value indicating if the customer who placed this order is a guest. The default is false.`,
      default: {
        '@if': {
          exists: { '@path': '$.traits.is_guest' },
          then: { '@path': '$.traits.is_guest' },
          else: false
        }
      }
    },
    utms: {
      label: 'UTMs',
      type: 'object',
      description: `Player's utms`,
      multiple: true,
      properties: {
        campaign: {
          label: 'Campaign',
          type: 'string',
          description: `UTM campaign name`
        },
        source: {
          label: 'Source',
          type: 'string',
          description: `UTM campaign source`
        },
        medium: {
          label: 'Medium',
          type: 'string',
          description: `UTM campaign medium`
        },
        content: {
          label: 'Content',
          type: 'string',
          description: `UTM campaign content`
        },
        term: {
          label: 'Term',
          type: 'string',
          description: `UTM campaign term`
        }
      },
      default: {
        '@arrayPath': [
          '$.context.campaign',
          {
            campaign: {
              '@path': '$.name'
            },
            source: {
              '@path': '$.source'
            },
            medium: {
              '@path': '$.medium'
            },
            content: {
              '@path': '$.content'
            },
            term: {
              '@path': '$.term'
            }
          }
        ]
      }
    },
    devices: {
      label: 'Devices',
      type: 'object',
      description: `Player's used devices`,
      multiple: true,
      properties: {
        userAgent: {
          label: 'User Agent',
          type: 'string',
          description: `User agent`
        },
        os: {
          label: 'OS',
          type: 'string',
          description: `Player operating system`
        },
        device: {
          label: 'Player device',
          type: 'string',
          description: `Player used device`
        }
      },
      default: {
        '@arrayPath': [
          '$.context',
          {
            userAgent: {
              '@path': '$.userAgent'
            },
            os: {
              '@path': '$.os.name'
            },
            device: {
              '@path': '$.device.name'
            }
          }
        ]
      }
    },
    totalSpent: {
      label: 'Total Spent',
      type: 'number',
      description: `Player's total spent amount`,
      default: {
        '@path': '$.traits.totalSpent'
      }
    },
    lastOrderDate: {
      label: 'Last Order Date',
      type: 'datetime',
      description: `Player's last order date`,
      default: {
        '@path': '$.traits.lastOrderDate'
      }
    },
    totalOrders: {
      label: 'Total Orders',
      type: 'number',
      description: `Player's total orders`,
      default: {
        '@path': '$.traits.totalOrders'
      }
    },
    avgOrderAmount: {
      label: 'Average Order Amount',
      type: 'number',
      description: `Player's average order amount`,
      default: {
        '@path': '$.traits.avgOrderAmount'
      }
    },
    tags: {
      label: 'Tags',
      type: 'string',
      description: `Comma separated string of tags to be attached to the player.`,
      default: {
        '@path': '$.traits.tags'
      }
    },
    playerCustomAttributes: {
      label: 'Player Custom Attributes',
      description: 'Key value pairs of any extra player attributes.',
      type: 'object',
      default: {
        '@path': '$.traits.extra'
      },
      additionalProperties: true
    },
    referrerCode: {
      label: 'Referrer Code',
      description: `Referring player’s referral code. This is used in case of referral, where the player to be created is referred by the player having this code.`,
      type: 'string',
      default: {
        '@path': '$.traits.referrerCode'
      }
    },
    levelOrder: {
      label: 'Level Order',
      description: `The level order to place the player in. IMPORTANT: manual player leveling is available under special circumstances and is not available by default. Contact us for more info.`,
      type: 'number',
      default: {
        '@path': '$.traits.levelOrder'
      }
    },
    deviceToken: {
      label: 'Device Token',
      description: `The FCM token (Firebase Cloud Messaging) needed for sending mobile push notifications. (Used only in case of mobile app)`,
      type: 'string',
      default: {
        '@path': '$.traits.deviceToken'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    const endpoint = `${endpoints.baseApiUrl}${endpoints.identifyPlayer}`
    return await sendRequest(request, endpoint, settings, mapPayload(payload))
  }
}

export default action
