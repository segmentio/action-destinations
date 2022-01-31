import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  anonymousId: {
    label: 'Anonymous ID',
    type: 'string',
    allowNull: true,
    description: 'The generated anonymous ID for the user',
    default: {
      '@path': '$.anonymousId'
    }
  },
  context: {
    label: 'Event Context',
    type: 'object',
    description: 'Segment context with ip and userAgent',
    required: true,
    default: { '@path': '$.context' },
    properties: {
      campaign: {
        label: 'UTM Properties',
        type: 'object',
        description: 'UTM Tracking Properties',
        properties: {
          source: {
            label: 'UTM Source',
            type: 'string',
            default: { '@path': '$.context.campaign.source' }
          },
          medium: {
            label: 'UTM Medium',
            type: 'string',
            default: { '@path': '$.context.campaign.medium' }
          },
          name: {
            label: 'UTM Campaign',
            type: 'string',
            default: { '@path': '$.context.campaign.name' }
          },
          term: {
            label: 'UTM Term',
            type: 'string',
            default: { '@path': '$.context.campaign.term' }
          },
          content: {
            label: 'UTM Content',
            type: 'string',
            default: { '@path': '$.context.campaign.content' }
          }
        }
      },
      location: {
        label: 'Location',
        type: 'object',
        description: 'information about the user’s current location',
        properties: {
          city: {
            label: 'City',
            type: 'string',
            default: {'@path': '$.context.location.city'}
          },
          country: {
            label: 'Country',
            type: 'string',
            default: {'@path': '$.context.location.country'}
          },
          latitude: {
            label: 'Latitude',
            type: 'number',
            default: {'@path': '$.context.location.latitude'}
          },
          longitude: {
            label: 'Longitude',
            type: 'number',
            default: {'@path': '$.context.location.longitude'}
          },
          region: {
            label: 'Region',
            type: 'string',
            default: {'@path': '$.context.location.region'}
          },
          speed: {
            label: 'Speed',
            type: 'number',
            default: {'@path': '$.context.location.speed'}
          }
        }
      },
      page: {
        label: 'Page Properties',
        type: 'object',
        description: 'Current page properties',
        properties: {
          path: {
            label: 'Page path',
            type: 'string',
            default: {'@path': '$.context.page.path'}
          },
          referrer: {
            label: 'Referrer',
            type: 'string',
            default: {'@path': '$.context.page.referrer'}
          },
          search: {
            label: 'Search',
            type: 'string',
            default: {'@path': '$.context.page.search'}
          },
          title: {
            label: 'Title',
            type: 'string',
            default: {'@path': '$.context.page.title'}
          },
          url: {
            label: 'Url',
            type: 'string',
            default: {'@path': '$.context.page.url'}
          }
        }
      },
      screen: {
        label: 'Screen Properties',
        type: 'object',
        description: 'Screen Properties',
        properties: {
          width: {
            label: 'Screen Width',
            type: 'number',
            default: {'@path': '$.context.screen.width'}
          },
          height: {
            label: 'Screen Height',
            type: 'number',
            default: {'@path': '$.context.screen.height'}
          }
        }
      },
      app: {
        label: 'Application Properties',
        type: 'object',
        description: 'Application Properties',
        properties: {
          name: {
            label: 'Name',
            type: 'string',
            default: {'@path': '$.context.app.name'},
          },
          version: {
            label: 'Version',
            type: 'string',
            default: {'@path': '$.context.app.version'}
          },
          build: {
            label: 'Build',
            type: 'string',
            default: {'@path': '$.context.app.build'}
          }
        }
      },
      device: {
        label: 'Device Properties',
        type: 'object',
        description: 'Device Properties',
        default: {'@path': '$.context.device'}
      },
      network: {
        label: 'Network Properties',
        type: 'object',
        description: 'Network Properties',
        default: {'@path': '$.context.network'}
      },
      library: {
        label: 'Library Properties',
        type: 'object',
        description: 'Device Properties',
        properties: {
          name: {
            label: 'Name',
            type: 'string',
            default: {'@path': '$.context.library.name'},
          },
          version: {
            label: 'Version',
            type: 'string',
            default: {'@path': '$.context.library.version'}
          }
        }
      },
      ip: {
        label: 'Users IP address',
        type: 'string',
        description: 'Users IP address',
        default: {'@path': '$.context.ip'}
      },
      locale: {
        label: 'Users Locale string',
        type: 'string',
        description: 'Users Locale string',
        default: {'@path': '$.context.locale'}
      },
      userAgent: {
        label: 'User Agent string',
        type: 'string',
        description: 'User Agent string',
        default: {'@path': '$.context.userAgent'}
      }
    }
  },
  messageId: {
    type: 'string',
    label: 'Message ID',
    description: 'The message ID uniquely identifies an event to ensure each event is only processed once.',
    required: true,
    default: {
      '@path': '$.messageId'
    }
  },
  receivedAt: {
    type: 'datetime',
    label: 'receivedAt',
    description: 'The timestamp at which this event was received.',
    required: true,
    default: {
      '@path': '$.receivedAt'
    }
  },
  sentAt: {
    type: 'datetime',
    label: 'sentAt',
    description: 'The timestamp at which this was sent.',
    required: true,
    default: {
      '@path': '$.sentAt'
    }
  },
  timestamp: {
    type: 'datetime',
    label: 'timestamp',
    description: 'The timestamp at which this event occurred.',
    required: true,
    default: {
      '@path': '$.timestamp'
    }
  },
  userId: {
    label: 'User ID',
    type: 'string',
    allowNull: true,
    required: true,
    description: 'The unique user identifier',
    default: {
      '@path': '$.userId'
    }
  },
  type: {
    label: 'Type',
    type: 'string',
    allowNull: false,
    required: true,
    description: 'Segment event type',
    default: {
      '@path': '$.type'
    }
  },
  version: {
    label: 'Version',
    type: 'number',
    allowNull: true,
    required: false,
    description: 'Version of the Segment Tracking API that received the message',
    default: {
      '@path': '$.version'
    }
  },
}
