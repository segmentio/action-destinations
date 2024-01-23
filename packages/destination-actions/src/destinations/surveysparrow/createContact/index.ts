import { PayloadValidationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Contact in SurveySparrow',
  defaultSubscription: 'type=identify',
  description: 'This Action will create new Contact in your SurveySparrow. If the Contact is already present, this will update the Contact. Either Email or Mobile Number is mandatory to create a Contact.',
  fields: {
    full_name: {
      label: 'Name',
      type: 'string',
      description: 'Full name of the Contact',
      default: {
        '@path': '$.traits.name'
      }
    },
    phone: {
      label: 'Phone',
      type: 'string',
      description: 'Phone number of the Contact. This should include + followed by Country Code. For Example, +18004810410',
      default: {
        '@path': '$.traits.phone'
      }
    },
    mobile: {
      label: 'Mobile',
      type: 'string',
      description: 'Mobile number of the Contact. This should include + followed by Country Code. For Example, +18004810410',
      default: {
        '@path': '$.traits.mobile'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email address of the Contact',
      default: {
        '@path': '$.traits.email'
      }
    },
    job_title: {
      label: 'Job Title',
      type: 'string',
      description: 'Job title of the contact',
      default: {
        '@path': '$.traits.job_title'
      }
    },
    custom_fields: {
      label: 'Custom Contact Properties',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      description: 'Key and Values for Custom Properties to be added to the contact. [Contact Property](https://support.surveysparrow.com/hc/en-us/articles/7078996288925-How-to-add-custom-properties-to-your-contact) should be created in SurveySparrow before using here.',
      default: {
        '@path': '$.traits.custom_fields'
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
      });
    }
    else {
      throw new PayloadValidationError('Email or Mobile is Required Field');
    }
  }
}

export default action
