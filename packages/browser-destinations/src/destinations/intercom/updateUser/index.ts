import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { getCompanyProperties } from '../sharedCompanyProperties'
import { getLauncherProperties } from '../sharedLauncherProperties'
import { convertISO8601toUnix, filterCustomTraits, isEmpty } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = getCompanyProperties()
const launcherProperties: Record<string, InputField> = getLauncherProperties()

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update',
  description: '',
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
    phone: {
      description: 'The phone number of the current user/lead.',
      label: 'Phone',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.phone'
      }
    },
    unsubscribed_from_emails: {
      description: 'The email unsubscribe status for the user.',
      label: 'Unsubscribed From Emails',
      type: 'boolean',
      required: false,
      default: {
        '@path': '$.traits.unsubscribedFromEmails'
      }
    },
    language_override: {
      description: 'The messenger language (instead of relying on browser language settings).',
      label: 'Language Override',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.languageOverride'
      }
    },
    email: {
      description: "User's email.",
      label: 'Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    created_at: {
      description: 'A timestamp of when the person was created.',
      label: 'Created At',
      type: 'datetime',
      required: false,
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    avatar: {
      description: 'The avatar/profile image associated to the user.',
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
            '@path': '$.traits.avatar.imageUrl'
          }
        },
        type: {
          description: 'This is not sent by the user, it is manually set to avatar.',
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
        '@path': '$.context.Intercom.user_hash'
      }
    },
    ...launcherProperties,
    company: {
      description: "The user's company.",
      label: 'Company',
      type: 'object',
      required: false,
      properties: companyProperties,
      default: {
        company_id: { '@path': '$.traits.company.id' },
        name: { '@path': '$.traits.company.name' },
        created_at: { '@path': '$.traits.company.createdAt' },
        plan: { '@path': '$.traits.company.plan' },
        monthly_spend: { '@path': '$.traits.company.monthlySpend' },
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
            created_at: { '@path': '$.createdAt' },
            plan: { '@path': '$.plan' },
            monthly_spend: { '@path': '$.monthlySpend' },
            size: { '@path': '$.size' },
            website: { '@path': '$.website' },
            industry: { '@path': '$.industry' },
            company_custom_traits: { '@path': '$.' }
          }
        ]
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
    if (isEmpty(payload.avatar)) {
      delete payload.avatar
    } else {
      // add type = 'avatar' to avatar object since Intercom requires it
      if (payload.avatar) payload.avatar.type = 'avatar'
    }

    //mutate objects by converting their 'created_at' date properties from ISO-8601 to UNIX
    const companies = Array.isArray(payload.companies) ? [...payload.companies] : []
    const datesToConvert = [payload, payload.company, ...companies]
    for (const objectWithDateProp of datesToConvert) {
      if (objectWithDateProp && objectWithDateProp?.created_at) {
        objectWithDateProp.created_at = convertISO8601toUnix(objectWithDateProp.created_at)
      }
    }

    //define the reservedFields
    const reservedFields = [
      ...Object.keys(action.fields),
      ...Object.keys(companyProperties),
      'createdAt',
      'unsubscribedFromEmails',
      'languageOverride',
      'userHash',
      'companyId',
      'monthlySpend',
      'id'
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

    // send user's inbox button selector option
    const widget = { activator: Intercom.customInboxButtonSelector }

    // API call
    Intercom('update', {
      ...payload,
      ...filteredCustomTraits,
      widget
    })
  }
}

export default action
