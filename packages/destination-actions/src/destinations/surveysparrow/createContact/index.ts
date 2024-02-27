import { PayloadValidationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Contact in SurveySparrow',
  defaultSubscription: 'type=identify',
  description:
    'This Action will create a new Contact or update an existing Contact in SurveySparrow. One of Email or Mobile are mandatory when creating a Contact.',
  fields: {
    full_name: {
      label: 'Name',
      type: 'string',
      description: 'Full name of the Contact',
      default: {
        '@if': {
          exists: { '@path': '$.properties.name' },
          then: { '@path': '$.properties.name' },
          else: { '@path': '$.context.traits.name' }
        }
      }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description:
        'Non Mobile Phone number for the Contact. This should include + followed by Country Code. For Example, +18004810410',
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      }
    },
    mobile: {
      label: 'Mobile',
      type: 'string',
      description:
        'Mobile number for the Contact. This should include + followed by Country Code. For Example, +18004810410',
      default: {
        '@if': {
          exists: { '@path': '$.properties.mobile' },
          then: { '@path': '$.properties.mobile' },
          else: { '@path': '$.context.traits.mobile' }
        }
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      format: 'email',
      description: 'Email Address for the Contact',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    job_title: {
      label: 'Job Title',
      type: 'string',
      description: 'Job Title for the Contact',
      default: {
        '@if': {
          exists: { '@path': '$.properties.job_title' },
          then: { '@path': '$.properties.job_title' },
          else: { '@path': '$.context.traits.job_title' }
        }
      }
    },
    custom_fields: {
      label: 'Custom Contact Properties',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      description:
        'Key:Value Custom Properties to be added to the Contact in SurveySparrow. [Contact Property](https://support.surveysparrow.com/hc/en-us/articles/7078996288925-How-to-add-custom-properties-to-your-contact) should be created in SurveySparrow in advance.',
      default: {
        '@if': {
          exists: { '@path': '$.properties.custom_fields' },
          then: { '@path': '$.properties.custom_fields' },
          else: { '@path': '$.context.traits.custom_fields' }
        }
      }
    }
  },
  perform: (request, { payload }) => {
    if (payload.email || payload.mobile) {
      const transformedPayload = {
        full_name: payload.full_name,
        phone: payload.phone,
        mobile: payload.mobile,
        email: payload.email,
        job_title: payload.job_title,
        ...payload.custom_fields
      }
      return request('https://api.surveysparrow.com/v3/contacts', {
        method: 'post',
        json: transformedPayload
      })
    } else {
      throw new PayloadValidationError('Either Email or Mobile are required')
    }
  }
}

export default action
