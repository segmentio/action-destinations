import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Conversion',
  description: 'Send Conversion Event to Nextdoor',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the event to track',
      type: 'string',
      required: true,
      choices: [
        { label: 'Conversion', value: 'conversion' },
        { label: 'Custom Conversion 1', value: 'custom_conversion_1' },
        { label: 'Custom Conversion 2', value: 'custom_conversion_2' },
        { label: 'Custom Conversion 3', value: 'custom_conversion_3' },
        { label: 'Custom Conversion 4', value: 'custom_conversion_4' },
        { label: 'Custom Conversion 5', value: 'custom_conversion_5' },
        { label: 'Custom Conversion 6', value: 'custom_conversion_6' },
        { label: 'Custom Conversion 7', value: 'custom_conversion_7' },
        { label: 'Custom Conversion 8', value: 'custom_conversion_8' },
        { label: 'Custom Conversion 9', value: 'custom_conversion_9' },
        { label: 'Custom Conversion 10', value: 'custom_conversion_10' },
        { label: 'Lead', value: 'lead' },
        { label: 'Purchase', value: 'purchase' },
        { label: 'Sign Up', value: 'sign_up' }
      ]
    },
    event_id: {
      label: 'Event ID',
      description: 'A unique ID for the event. This is used to deduplicate events sent by the browser and server.',
      type: 'string',
      required: false
    },
    event_time: {
      label: 'Event Time',
      description: 'UCT Timestamp with ISO 8601 format. For example, 2022-11-23T03:30:52Z',
      type: 'string',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    event_timezone: {
      label: 'Event Time Zone',
      description: 'The timezone of the event. TODO: Add more information about this field.',
      type: 'string',
      required: false
    },
    action_source: {
      label: 'Action Source',
      description: 'Indicates the channel through which conversion happened.',
      type: 'string',
      required: true,
      choices: [
        { label: 'email', value: 'email' },
        { label: 'website', value: 'website' },
        { label: 'app', value: 'app' },
        { label: 'phone_call', value: 'phone_call' },
        { label: 'chat', value: 'chat' },
        { label: 'physical_store', value: 'physical_store' },
        { label: 'system_generated', value: 'system_generated' },
        { label: 'other', value: 'custom_conversion_8' }
      ]
    },
    client_id: {
      label: 'Nextdoor Advertiser ID',
      description: 'Your Nextdoor Advertiser ID for self serve clients can be found in your NAM account for managed your support team can provide',
      type: 'string',
      required: true
    },
    action_source_url: {
      label: 'Action Source url',
      description: 'The browser URL where the event happened (required for web events).',
      type: 'string',
      required: false,
      default: { '@path': '$.context.page.url' }
    },
    delivery_optimization: {
      label: 'Delivery Optimization',
      description: 'True indicates data can be used for optimization. False indicates the data will only be used for attribution',
      type: 'boolean',
      required: false,
      default: true
    },
    test_event: {
      label: 'Test Event',
      description: 'Flag to indicate if this is a test event.',
      type: 'string',
      required: false,
      default: false
    },
    partner_id: {
      label: 'Partner Id',
      description: 'ID of partners like Segment',
      unsafe_hidden: true,
      type: 'string',
      required: true,
      choices: [
        { label: 'Segment', value: 'segment' }
      ],
      default: 'segment'
    },
    customer: {
      label: 'Customer Data',
      description: 'Customer profile data used to match with Nextdoor users. At least one of the fields is required.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      properties: {
        email: {
          label: 'Email',
          description: 'Customer email address',
          type: 'string',
          required: false,
        },
        phone_number: {
          label: 'Phone Number',
          description: 'Phone number format should consist of exactly ten digits, devoid of any special characters or international country codes e.g. 4129614932',
          type: 'string',
          required: false,
        },
        first_name: {
          label: 'First Name',
          description: 'Customer first name.',
          type: 'string',
          required: false,
        },
        last_name: {
          label: 'Last Name',
          description: 'Customer last name.',
          type: 'string',
          required: false,
        },
        date_of_birth: {
          label: 'Date of Birth',
          description: 'Customer date of birth in ISO 8601 format. For example, 1990-01-01',
          type: 'string',
          required: false,
        },
        street_address: {
          label: 'Street Address',
          description: 'Customer street address.',
          type: 'string',
          required: false,
        },
        city: {
          label: 'City',
          description: 'Customer city.',
          type: 'string',
          required: false,
        },
        state: {
          label: 'State',
          description: 'Customer State.',
          type: 'string',
          required: false,
        },
        country: {
          label: 'Customer Country',
          description: 'Customer Customer country code (2-letter country codes in ISO 3166-1 alpha-2).',
          type: 'string',
          required: false,
        },
        zip_code: {
          label: 'Zip Code',
          description: 'Customer Zip code.',
          type: 'string',
          required: false,
        },
        pixel_id: {
          label: 'Nextdoor Pixel Id',
          description: 'Nextdoor Pixel Id. Used for deduplication when events are sent via CAPI and front end Pixel.',
          type: 'string',
          required: false,
        },
        click_id: {
          label: 'Nextdoor Click ID',
          description: 'Next Door Click ID - ndclid parameter from the URL', 
          type: 'string',
          required: false,
        },
        client_ip_address: {
          label: 'Customer IP Address',
          description: 'Customer IP Address Must be a valid IPV4 or IPV6 address.',
          type: 'string',
          required: false,
        }
      },
      default: {
        email: { 
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        },
        phone_number: { 
          '@if': {
            exists: { '@path': '$.context.traits.phone' },
            then: { '@path': '$.context.traits.phone' },
            else: { '@path': '$.properties.phone' }
          }
        },
        first_name: { 
          '@if': {
            exists: { '@path': '$.context.traits.first_name' },
            then: { '@path': '$.context.traits.first_name' },
            else: { '@path': '$.properties.first_name' }
          }
        },
        last_name: { 
          '@if': {
            exists: { '@path': '$.context.traits.last_name' },
            then: { '@path': '$.context.traits.last_name' },
            else: { '@path': '$.properties.last_name' }
          }
        },
        date_of_birth: {
          '@if': {
            exists: { '@path': '$.context.traits.birthday' },
            then: { '@path': '$.context.traits.birthday' },
            else: { '@path': '$.properties.birthday' }
          }
        },
        street_address: {
          '@if': {
            exists: { '@path': '$.context.traits.address.street' },
            then: { '@path': '$.context.traits.address.street' },
            else: { '@path': '$.properties.address.street' }
          }
        },
        city: {
          '@if': {
            exists: { '@path': '$.context.traits.address.city' },
            then: { '@path': '$.context.traits.address.city' },
            else: { '@path': '$.properties.address.city' }
          }
        },
        state: {
          '@if': {
            exists: { '@path': '$.context.traits.address.state' },
            then: { '@path': '$.context.traits.address.state' },
            else: { '@path': '$.properties.address.state' }
          }
        },
        country: {
          '@if': {
            exists: { '@path': '$.context.traits.address.country' },
            then: { '@path': '$.context.traits.address.country' },
            else: { '@path': '$.properties.address.country' }
          }
        },
        zip_code: {
          '@if': {
            exists: { '@path': '$.context.traits.address.postal_code' },
            then: { '@path': '$.context.traits.address.postal_code' },
            else: { '@path': '$.properties.address.postal_code' }
          }
        },
        pixel_id: {
          '@if': {
            exists: { '@path': '$.context.traits.pixel_id' },
            then: { '@path': '$.context.traits.pixel_id' },
            else: { '@path': '$.properties.pixel_id' }
          }
        },
        click_id: {
          '@if': {
            exists: { '@path': '$.context.traits.click_id' },
            then: { '@path': '$.context.traits.click_id' },
            else: { '@path': '$.properties.click_id' }
          }
        },
        client_ip_address: {'@path': '$.context.ip' }
      }
    },
    custom: {
      label: 'Custom Data',
      description: 'Custom objects contains fields specific to advertisers that are not already covered in standard fields.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: false,
      properties: {
        order_value: {
          label: 'Order Value',
          description: 'Required for purchase events. Total numeric value associated with the event. E.g. 99.99 denotes $99.99 USD. Currency is specified in the Currency field.',
          type: 'string',
          required: false
        },
        currency: {
          label: 'Currency',
          description: 'Currency of the order value. Use the 3-letter currency code from ISO 4217 standard.',
          type: 'string',
          required: false
        },
        order_id: {
          label: 'Order ID',
          description: 'The order ID for this transaction. Required for offline events.',
          type: 'string',
          required: false,
        },
        delivery_category: {
          label: 'Delivery Category',
          description: 'How a product is delivered',
          type: 'string',
          required: false,
          choices: [
            { label: 'In store', value: 'in_store' },
            { label: 'Curbside', value: 'curbside' },
            { label: 'Home Delivery', value: 'home_delivery' }
          ]
        }
      },
      default: {
        order_value: { '@path': '$.properties.total' },
        currency: { '@path': '$.properties.currency' },
        order_id: { '@path': '$.properties.order_id'}
      }   
    },
    product_context: {
      label: 'Product Context',
      description: 'Product details associated with the event.',
      type: 'object',
      multiple: true,
      required: false,
      additionalProperties: true, 
      properties: {
        id: {
          label: 'Product ID',
          description: 'Product ID',
          type: 'string',
          required: true
        },
        quantity: {
          label: 'Product Quantity',
          description: 'Product Quantity',
          type: 'number',
          required: false
        },
        item_price: {
          label: 'Product Price',
          description: 'Product Price',
          type: 'string',
          required: false
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            id: {
              '@path': '$.product_id'
            },
            quantity: {
              '@path': '$.quantity'
            },
            item_price: {
              '@path': '$.price'
            }
          }
        ]
      }
    },
    app: {
      label: 'Mobile App Event Parameters',
      description: 'Data about the source Mobile app. Required for app events',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: false,
      properties: {
        app_id: {
          label: 'App Id',
          description: 'A unique ID for advertisers mobile app ID from App store and Google Play Store.',
          type: 'string',
          required: false,
        },
        app_tracking_enabled: {
          label: 'App Tracking Enabled',
          description: 'Users opt out settings for ATT',
          type: 'boolean',
          required: false,
        },
        platform: {
          label: 'App Platfrom',
          description: 'Mobile app platform',
          type: 'string',
          required: false,
          choices: [
            { label: 'iOS', value: 'ios' },
            { label: 'Android', value: 'android' },
          ]
        },
        app_version: {
          label: 'App Version',
          description: 'Mobile app version',
          type: 'string',
          required: false,
        }
      },
      default: {
        app_id: { '@path': '$.context.app.name' },
        app_tracking_enabled: { '@path': '$.context.device.adTrackingEnabled' },
        platform: { '@path': '$.context.app.type' },
        app_version: { '@path': '$.context.app.version' }
      }
    }
  },
  perform: (request, {settings, payload}) => {

    const apiKey = settings.apiKey




    const data = {
      event_name: payload.event_name,
      event_id: payload.event_id,
      event_time: payload.event_time,
      action_source: payload.action_source,
      client_id: payload.client_id,
      action_source_url: payload.action_source_url,
      customer: payload.customer,
      custom: { ...payload.custom, ...payload.product_context }

    }


    return request('https://example.com', {
      method: 'post',
      json: data
    })
  }
}

export default action
