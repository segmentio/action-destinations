import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { getCompanyProperties } from '../sharedCompanyProperties'
import { convertDateToUnix, filterCustomTraits, getWidgetOptions, isEmpty } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = getCompanyProperties()

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update User',
  description: 'Create or Update an Intercom User',
  platform: 'web',
  fields: {
    user_id: {
      description: "The user's identity.",
      label: 'Identity',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    custom_traits: {
      description: "The user's custom traits.",
      label: 'Custom Traits',
      type: 'object',
      required: false,
      default: {
        '@path': '$.traits'
      }
    },
    name: {
      description: "The user's name.",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.name'
      }
    },
    first_name: {
      description: "The user's first name.",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.firstName' },
          then: { '@path': '$.traits.firstName' },
          else: { '@path': '$.traits.first_name' }
        }
      }
    },
    last_name: {
      description: "The user's last name.",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.lastName' },
          then: { '@path': '$.traits.lastName' },
          else: { '@path': '$.traits.last_name' }
        }
      }
    },
    phone: {
      description: "The user's phone number.",
      label: 'Phone',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.phone'
      }
    },
    unsubscribed_from_emails: {
      description: "The user's email unsubscribe status.",
      label: 'Unsubscribed From Emails',
      type: 'boolean',
      required: false
    },
    language_override: {
      description: "The user's messenger language (instead of relying on browser language settings).",
      label: 'Language Override',
      type: 'string',
      required: false
    },
    email: {
      description: "The user's email.",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    created_at: {
      description: 'A timestamp of when the user was created.',
      label: 'Created At',
      type: 'datetime',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.createdAt' },
          then: { '@path': '$.traits.createdAt' },
          else: { '@path': '$.traits.created_at' }
        }
      }
    },
    avatar: {
      description: "The user's avatar/profile image.",
      label: 'Avatar',
      type: 'object',
      required: false,
      properties: {
        image_url: {
          description: 'The avatar/profile image URL.',
          label: 'Image URL',
          type: 'string',
          required: true,
          default: {
            '@path': '$.traits.avatar'
          }
        },
        type: {
          description: "This is manually set to 'avatar'.",
          label: 'Type',
          type: 'string',
          required: true,
          default: 'avatar'
        }
      }
    },
    user_hash: {
      description: 'This is used for identity verification.',
      label: 'User Hash',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.Intercom.user_hash' },
          then: { '@path': '$.context.Intercom.user_hash' },
          else: { '@path': '$.context.Intercom.userHash' }
        }
      }
    },
    company: {
      description: "The user's company.",
      label: 'Company',
      type: 'object',
      required: false,
      properties: companyProperties,
      default: {
        company_id: { '@path': '$.traits.company.id' },
        name: { '@path': '$.traits.company.name' },
        created_at: {
          '@if': {
            exists: { '@path': '$.traits.company.createdAt' },
            then: { '@path': '$.traits.company.createdAt' },
            else: { '@path': '$.traits.company.created_at' }
          }
        },
        plan: { '@path': '$.traits.company.plan' },
        size: { '@path': '$.traits.company.size' },
        website: { '@path': '$.traits.company.website' },
        industry: { '@path': '$.traits.company.industry' },
        company_custom_traits: { '@path': '$.traits.company' }
      }
    },
    companies: {
      description: 'The array of companies the user is associated to.',
      label: 'Companies',
      type: 'object',
      multiple: true,
      required: false,
      properties: companyProperties,
      default: {
        '@arrayPath': [
          '$.traits.companies',
          {
            company_id: { '@path': '$.id' },
            name: { '@path': '$.name' },
            created_at: {
              '@if': {
                exists: { '@path': '$.createdAt' },
                then: { '@path': '$.createdAt' },
                else: { '@path': '$.created_at' }
              }
            },
            plan: { '@path': '$.plan' },
            size: { '@path': '$.size' },
            website: { '@path': '$.website' },
            industry: { '@path': '$.industry' },
            company_custom_traits: { '@path': '$.' }
          }
        ]
      }
    },
    hide_default_launcher: {
      description:
        'Selectively show the chat widget. According to Intercom’s docs, you want to first hide the Messenger for all users inside their UI using Messenger settings. Then think about how you want to programmatically decide which users you’d like to show the widget to.',
      label: 'Hide Default Launcher',
      type: 'boolean',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.Intercom.hideDefaultLauncher' },
          then: { '@path': '$.context.Intercom.hideDefaultLauncher' },
          else: { '@path': '$.context.Intercom.hide_default_launcher' }
        }
      }
    }
  },
  perform: (Intercom, event) => {
    // remove traits from payload; traits will not be sent in the final payload to Intercom
    const { custom_traits, ...rest } = event.payload
    const payload = { ...rest }

    // remove avatar & company if they are empty
    if (isEmpty(payload.company)) {
      delete payload.company
    }
    if (isEmpty(payload.avatar) || !payload.avatar) {
      delete payload.avatar
    } else {
      // add type = 'avatar' to avatar object since Intercom requires it
      payload.avatar.type = 'avatar'
    }

    // if no name provided, concatenate firstName & lastName to form name
    if (!payload.name && payload.first_name) {
      payload.name = payload.first_name
      if (payload.last_name) {
        payload.name += ' ' + payload.last_name
      }
    }
    if (payload.first_name) {
      delete payload.first_name
    }
    if (payload.last_name) {
      delete payload.last_name
    }

    //convert 'created_at' date properties from ISO-8601 to UNIX
    const companies = Array.isArray(payload.companies) ? [...payload.companies] : []
    const datesToConvert = [payload, payload.company, ...companies]
    for (const objectWithDateProp of datesToConvert) {
      if (objectWithDateProp && objectWithDateProp?.created_at) {
        objectWithDateProp.created_at = convertDateToUnix(objectWithDateProp.created_at)
      }
    }

    //define the reservedFields
    const reservedFields = [
      ...Object.keys(action.fields),
      ...Object.keys(companyProperties),
      'createdAt',
      'userHash',
      'companyId',
      'monthlySpend',
      'id',
      'firstName',
      'lastName'
    ]

    // filter out reserved fields for user, drop custom objects & arrays
    const filteredCustomTraits = filterCustomTraits(reservedFields, custom_traits)

    // filter out reserved fields for company, drop custom objects & arrays
    if (payload.company) {
      const { company_custom_traits, ...rest } = payload.company
      const companyFilteredCustomTraits = filterCustomTraits(reservedFields, company_custom_traits)
      payload.company = { ...rest, ...companyFilteredCustomTraits }
    }

    // filter out reserved fields for companies array, drop custom objects & arrays
    if (payload.companies) {
      payload.companies = payload.companies.map((company) => {
        const { company_custom_traits, ...rest } = company
        const companyFilteredCustomTraits = filterCustomTraits(reservedFields, company_custom_traits)
        company = { ...rest, ...companyFilteredCustomTraits }
        return company
      })
    }

    //get user's widget options
    const widgetOptions = getWidgetOptions(payload.hide_default_launcher, Intercom.activator)

    // API call
    Intercom('update', {
      ...payload,
      ...filteredCustomTraits,
      ...widgetOptions
    })
  }
}

export default action
