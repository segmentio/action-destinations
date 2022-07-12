import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { getCompanyProperties } from '../sharedCompanyProperties'
import { getLauncherProperties } from '../sharedLauncherProperties'
import { convertISO8601toUnix, filterCustomTraits } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = getCompanyProperties()
const launcherProperties: Record<string, InputField> = getLauncherProperties()

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update Company',
  description: '',
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
    ...launcherProperties
  },
  perform: (Intercom, event) => {
    //remove traits from payload; traits will not be sent in the final payload to Intercom
    const { company_custom_traits, ...rest } = event.payload.company
    let company = { ...rest }
    const hide_default_launcher = event.payload.hide_default_launcher

    //convert date from ISO-8601 to UNIX
    if (company?.created_at) {
      company.created_at = convertISO8601toUnix(company.created_at)
    }

    //filter out reserved fields, drop custom objects & arrays
    const reservedFields = [...Object.keys(companyProperties), 'createdAt', 'monthlySpend']
    const filteredCustomTraits = filterCustomTraits(reservedFields, company_custom_traits)

    //merge filtered custom traits back into company object
    company = { ...company, ...filteredCustomTraits }

    // send user's inbox button selector option
    const widget = { activator: Intercom.customInboxButtonSelector }

    //API call
    Intercom('update', {
      company,
      widget,
      hide_default_launcher
    })
  }
}

export default action
