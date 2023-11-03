import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { getCompanyProperties } from '../sharedCompanyProperties'
import { convertDateToUnix, filterCustomTraits, getWidgetOptions } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = getCompanyProperties()

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Identify Company',
  description: 'Create or update a company in Intercom.',
  defaultSubscription: 'type = "group"',
  platform: 'web',
  fields: {
    company: {
      description: "The user's company.",
      label: 'Company',
      type: 'object',
      required: true,
      properties: companyProperties,
      default: {
        company_id: { '@path': '$.groupId' },
        name: { '@path': '$.traits.name' },
        created_at: {
          '@if': {
            exists: { '@path': '$.traits.createdAt' },
            then: { '@path': '$.traits.createdAt' },
            else: { '@path': '$.traits.created_at' }
          }
        },
        plan: { '@path': '$.traits.plan' },
        size: { '@path': '$.traits.size' },
        website: { '@path': '$.traits.website' },
        industry: { '@path': '$.traits.industry' },
        monthly_spend: { '@path': '$.traits.monthly_spend' }
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
    const { company_custom_traits, ...rest } = event.payload.company
    let company = { ...rest }

    // convert date from ISO-8601 to UNIX
    if (company?.created_at) {
      company.created_at = convertDateToUnix(company.created_at)
    }

    // drop custom objects & arrays
    const filteredCustomTraits = filterCustomTraits(company_custom_traits)

    // merge filtered custom traits back into company object
    company = { ...company, ...filteredCustomTraits }

    // get user's widget options
    const widgetOptions = getWidgetOptions(event.payload.hide_default_launcher, Intercom.activator)

    //API call
    Intercom('update', {
      company,
      ...widgetOptions
    })
  }
}

export default action
