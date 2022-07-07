import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { extractCompanyProperties } from '../sharedCompany'
import { convertISO8601toUnix, filterCustomTraits, isEmpty } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = extractCompanyProperties('company')

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update',
  description: '',
  platform: 'web',
  fields: {
    user_id: {
      type: 'string',
      required: false,
      description: "The user's identity",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to Intercom',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    },
    name: {
      type: 'string',
      required: false,
      description: "User's name",
      label: 'Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    phone: {
      type: 'string',
      required: false,
      description: 'Phone number of the current user/lead',
      label: 'Phone',
      default: {
        '@path': '$.traits.phone'
      }
    },
    unsubscribed_from_emails: {
      type: 'boolean',
      required: false,
      description: 'Sets the [unsubscribe status] of the record',
      label: 'Unsubscribed from emails',
      default: {
        '@path': '$.traits.unsubscribedFromEmails'
      }
    },
    language_override: {
      type: 'string',
      required: false,
      description: 'The messenger language (instead of relying on browser language settings)',
      label: 'Language Override',
      default: {
        '@path': '$.traits.languageOverride'
      }
    },
    email: {
      type: 'string',
      required: false,
      description: "User's email",
      label: 'Name',
      default: {
        '@path': '$.traits.email'
      }
    },
    created_at: {
      label: 'Created at',
      description: 'A timestamp of when the person was created',
      required: false,
      type: 'datetime',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    avatar: {
      label: 'avatar',
      description:
        'The avatar/profile image associated to the current record (typically gathered via social profiles via email address)',
      required: false,
      type: 'object',
      properties: {
        image_url: {
          label: 'Image URL',
          type: 'string',
          description: 'An avatar image URL. Note: needs to be https'
        },
        type: {
          label: 'type',
          type: 'string',
          description: 'is not sent by the user, manually set to avatar'
        }
      }
    },
    user_hash: {
      label: 'User Hash',
      description: 'Used for identity verification',
      required: false,
      type: 'string',
      default: {
        '@path': '$.traits.userHash'
      }
    },
    company: {
      label: 'Company',
      description: "The user's company",
      required: false,
      type: 'object',
      properties: companyProperties
    },
    companies: {
      label: 'Companies',
      description: 'An array of companies the user is associated to',
      required: false,
      multiple: true,
      type: 'object',
      properties: companyProperties
    }
  },
  perform: (Intercom, event) => {
    // remove traits from payload; traits will not be sent in the final payload to Intercom
    const { traits, ...rest } = event.payload
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

    //convert dates from ISO-8601 to UNIX
    const companies = Array.isArray(payload.companies) ? [...payload.companies] : []
    const datesToConvert = [payload, payload.company, ...companies]
    for (const objectWithDateProp of datesToConvert) {
      if (objectWithDateProp && objectWithDateProp?.created_at) {
        objectWithDateProp.created_at = convertISO8601toUnix(objectWithDateProp.created_at)
      }
    }

    // filter out reserved fields, drop custom objects & arrays
    let filteredCustomTraits = {}
    const reservedFields = [
      ...Object.keys(action.fields),
      ...Object.keys(companyProperties),
      'createdAt',
      'unsubscribedFromEmails',
      'languageOverride',
      'userHash',
      'companyId',
      'monthlySpend'
    ]
    filteredCustomTraits = filterCustomTraits(reservedFields, traits)

    // filter out reserved fields, drop custom objects & arrays
    if (payload.company) {
      const { company_traits, ...rest } = payload.company
      const companyFilteredCustomTraits = filterCustomTraits(reservedFields, company_traits)
      payload.company = { ...rest, ...companyFilteredCustomTraits }
    }

    // filter out reserved fields, drop custom objects & arrays
    if (payload.companies) {
      for (let i = 0; i < payload.companies.length; i++) {
        const { company_traits, ...rest } = payload.companies[i]
        const companyFilteredCustomTraits = filterCustomTraits(reservedFields, company_traits)
        payload.companies[i] = { ...rest, ...companyFilteredCustomTraits }
      }
    }

    console.log(payload)
    console.log(filteredCustomTraits)
    // API call
    Intercom('update', {
      ...payload,
      ...filteredCustomTraits
    })
  }
}

export default action
