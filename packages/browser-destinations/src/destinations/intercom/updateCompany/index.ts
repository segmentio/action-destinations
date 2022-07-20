import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { getCompanyProperties } from '../sharedCompanyProperties'
import { convertDateToUnix, filterCustomTraits, getWidgetOptions } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = getCompanyProperties()

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update Company',
  description: 'Create or Update an Intercom Company',
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
        created_at: { '@path': '$.traits.createdAt' },
        plan: { '@path': '$.traits.plan' },
        monthly_spend: { '@path': '$.traits.monthlySpend' },
        size: { '@path': '$.traits.size' },
        website: { '@path': '$.traits.website' },
        industry: { '@path': '$.traits.industry' },
        company_custom_traits: { '@path': '$.traits' }
      }
    },
    hide_default_launcher: {
      description:
        'selectively show the chat widget. According to Intercom’s docs, you want to first hide the Messenger for all users inside their UI using Messenger settings. Then think about how you want to programmatically decide which users you’d like to show the widget to.',
      label: 'Hide Default Launcher',
      type: 'boolean',
      required: false,
      default: {
        '@path': '$.context.Intercom.hideDefaultLauncher'
      }
    }
  },
  perform: (Intercom, event) => {
    //remove traits from payload; traits will not be sent in the final payload to Intercom
    const { company_custom_traits, ...rest } = event.payload.company
    let company = { ...rest }

    //convert date from ISO-8601 to UNIX
    if (company?.created_at) {
      company.created_at = convertDateToUnix(company.created_at)
    }

    //filter out reserved fields, drop custom objects & arrays
    const reservedFields = [...Object.keys(companyProperties), 'createdAt', 'monthlySpend']
    const filteredCustomTraits = filterCustomTraits(reservedFields, company_custom_traits)

    //merge filtered custom traits back into company object
    company = { ...company, ...filteredCustomTraits }

    //get user's widget options
    const widgetOptions = getWidgetOptions(event.payload.hide_default_launcher, Intercom.activator)

    //API call
    Intercom('update', {
      company,
      ...widgetOptions
    })
  }
}

export default action
