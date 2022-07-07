import { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { extractCompanyProperties } from '../sharedCompany'
import { convertISO8601toUnix, filterCustomTraits } from '../utils'
import type { Payload } from './generated-types'

const companyProperties: Record<string, InputField> = extractCompanyProperties('traits')

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Update Company',
  description: '',
  platform: 'web',
  fields: {
    company: {
      label: 'Company',
      description: "The user's company",
      required: true,
      type: 'object',
      properties: companyProperties
    }
  },
  perform: (Intercom, event) => {
    //remove traits from payload; traits will not be sent in the final payload to Intercom
    const { company_traits, ...rest } = event.payload.company
    let company = { ...rest }

    //convert date from ISO-8601 to UNIX
    if (company?.created_at) {
      company.created_at = convertISO8601toUnix(company.created_at)
    }

    //filter out reserved fields
    let filteredCustomTraits = {}
    const reservedFields = [...Object.keys(companyProperties), 'createdAt', 'monthlySpend']
    filteredCustomTraits = filterCustomTraits(reservedFields, company_traits)

    //merge filtered custom traits back into company object
    company = { ...company, ...filteredCustomTraits }

    //API call
    Intercom('update', {
      company
    })
  }
}

export default action
