import type { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
    userId: {
      label: 'User ID',
      description: 'The ID of the user',
      type: 'string',
      default: {
        '@path': '$.userId'
      },
      required: true
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous ID of the user',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      },
      required: false
    },
    context: {
      label: 'Context',
      description: 'The context properties to send with the event',
      type: 'object',
      properties: {
        ip: {
          label: 'IP Address',
          description: 'The IP address of the user',
          type: 'string'
        },
        url: {
          label: 'Page URL',
          description: 'The URL of the page',
          type: 'string',
          format: 'uri'
        },
        referrer: {
          label: 'Referrer',
          description: 'The referrer URL',
          type: 'string',
          format: 'uri'
        },
        os: {
          label: 'Operating System',
          description: 'The name of the operating system',
          type: 'string'
        },
        user_agent: {
          label: 'User Agent',
          description: 'The user agent string',
          type: 'string'
        },
        utm_campaign: {
          label: 'UTM Campaign / Name',
          description: 'The UTM campaign name',
          type: 'string'
        },
        utm_source: {
          label: 'UTM Source',
          description: 'The UTM source',
          type: 'string'
        },
        utm_medium: {
          label: 'UTM Medium',
          description: 'The UTM medium',
          type: 'string'
        },
        utm_term: {
          label: 'UTM Term',
          description: 'The UTM term',
          type: 'string'
        },
        utm_content: {
          label: 'UTM Content',
          description: 'The UTM content',
          type: 'string'
        },
        screen_width: {
          label: 'Screen Width',
          description: 'The width of the screen',
          type: 'number'
        },
        screen_height: {
          label: 'Screen Height',
          description: 'The height of the screen',
          type: 'number'
        },
        library_name: {
          label: 'Library Name',
          description: 'The name of the library sending the event',
          type: 'string'
        },
        library_version: {
          label: 'Library Version',
          description: 'The version of the library sending the event',
          type: 'string'
        },
        device_id: {
          label: 'Device ID',
          description: 'The device ID of the user',
          type: 'string'
        }
      },
      default: {
        ip: {
          '@path': '$.context.ip'
        },
        url: {
          '@path': '$.context.page.url'
        },
        referrer: {
          '@path': '$.context.page.referrer'
        },
        os: {
          '@path': '$.context.os.name'
        },
        user_agent: {
          '@path': '$.context.userAgent'
        },
        utm_campaign: {
          '@path': '$.context.campaign.name'
        },
        utm_source: {
          '@path': '$.context.campaign.source'
        },
        utm_medium: {
          '@path': '$.context.campaign.medium'
        },
        utm_term: {
          '@path': '$.context.campaign.term'
        },
        utm_content: {
          '@path': '$.context.campaign.content'
        },
        screen_width: {
          '@path': '$.context.screen.width'
        },
        screen_height: {
          '@path': '$.context.screen.height'
        },
        library_name: {
          '@path': '$.context.library.name'
        },
        library_version: {
          '@path': '$.context.library.version'
        },
        device_id: {
          '@path': '$.context.device.id'
        }
      },
      required: false
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      },
      required: true
    }
}