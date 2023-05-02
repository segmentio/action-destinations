import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { getCompanyProperties } from '../sharedCompanyProperties'
import { convertDateToUnix, filterCustomTraits, getWidgetOptions, isEmpty } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = getCompanyProperties()

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Identify User',
  description: 'Create or update a user in Intercom.',
  defaultSubscription: 'type = "identify" or type = "page"',
  platform: 'web',
  fields: {
    user_id: {
      description: 'A unique identifier for the user.',
      label: 'User ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    custom_traits: {
      description: "The user's custom attributes.",
      label: 'Custom Attributes',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue'
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
      description: "The user's phone number.",
      label: 'Phone Number',
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
      description: "The user's email address.",
      label: 'Email Address',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    created_at: {
      description: 'The time the user was created in your system.',
      label: 'User Creation Time',
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
    avatar_image_url: {
      description: "The URL for the user's avatar/profile image.",
      label: 'Avatar',
      type: 'string',
      required: false,
      default: { '@path': '$.traits.avatar' }
    },
    user_hash: {
      description:
        'The user hash used for identity verification. See [Intercom docs](https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile) for more information on how to set this field.',
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
        monthly_spend: { '@path': '$.traits.company.monthly_spend' }
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
            monthly_spend: { '@path': '$.monthly_spend' }
          }
        ]
      }
    },
    hide_default_launcher: {
      description:
        'Selectively show the chat widget. As per [Intercom docs](https://www.intercom.com/help/en/articles/189-turn-off-show-or-hide-the-intercom-messenger), you want to first hide the Messenger for all users inside the Intercom UI using Messenger settings. Then think about how you want to programmatically decide which users you would like to show the widget to.',
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
    // remove properties that require extra handling
    const { custom_traits, avatar_image_url, ...rest } = event.payload
    const payload = { ...rest }

    // remove company if it is empty
    if (isEmpty(payload.company?.company_custom_traits)) {
      delete payload.company?.company_custom_traits
    }
    if (isEmpty(payload.company)) {
      delete payload.company
    }

    // convert 'created_at' date properties from ISO-8601 to UNIX
    const companies = Array.isArray(payload.companies) ? [...payload.companies] : []
    const datesToConvert = [payload, payload.company, ...companies]
    for (const objectWithDateProp of datesToConvert) {
      if (objectWithDateProp && objectWithDateProp?.created_at) {
        objectWithDateProp.created_at = convertDateToUnix(objectWithDateProp.created_at)
      }
    }

    // drop custom objects & arrays
    const filteredCustomTraits = filterCustomTraits(custom_traits)

    // drop custom objects & arrays
    if (payload.company) {
      const { company_custom_traits, ...rest } = payload.company
      const companyFilteredCustomTraits = filterCustomTraits(company_custom_traits)
      payload.company = { ...rest, ...companyFilteredCustomTraits }
    }

    // drop custom objects & arrays
    if (payload.companies) {
      payload.companies = payload.companies.map((company) => {
        const { company_custom_traits, ...rest } = company
        const companyFilteredCustomTraits = filterCustomTraits(company_custom_traits)
        company = { ...rest, ...companyFilteredCustomTraits }
        return company
      })
    }

    // get user's widget options
    const widgetOptions = getWidgetOptions(payload.hide_default_launcher, Intercom.activator)

    // create the avatar object
    let avatar = {}
    if (avatar_image_url) {
      avatar = {
        image_url: avatar_image_url,
        type: 'avatar'
      }
    }

    // API call
    Intercom('update', {
      ...payload,
      ...filteredCustomTraits,
      ...widgetOptions,
      ...(!isEmpty(avatar) && { avatar })
    })
  }
}

export default action
