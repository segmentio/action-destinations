import type { ActionDefinition } from '@segment/actions-core'
import type { InputField } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AttioClient } from '../api'

const domain: InputField = {
  type: 'string',
  label: 'Domain',
  description: 'The domain of the Company (used to link the Workspace)',
  format: 'text',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.traits.website' },
      then: { '@path': '$.traits.website' },
      else: { '@path': '$.website' }
    }
  }
}

const name: InputField = {
  type: 'string',
  label: 'Name',
  description: 'The name of the Workspace',
  format: 'text',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.traits.name' },
      then: { '@path': '$.traits.name' },
      else: { '@path': '$.name' }
    }
  }
}

const company_attributes: InputField = {
  type: 'object',
  label: 'Additional Company attributes',
  description:
    'Additional attributes to either set or update on the Attio Company Record. The keys on the left should be ' +
    'Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.',
  defaultObjectUI: 'keyvalue:only',
  default: {}
}

const workspace_attributes: InputField = {
  type: 'object',
  label: 'Additional Workspace attributes',
  description:
    'Additional attributes to either set or update on the Attio Workspace Record. The keys on the left should be ' +
    'Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.',
  defaultObjectUI: 'keyvalue:only',
  default: {
    '@path': '$.properties'
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Workspace',
  description: 'Create or update an Attio Workspace and link it to a Company based on a domain attribute.',

  fields: {
    domain,
    name,
    company_attributes,
    workspace_attributes
  },

  perform: async (request, data) => {
    const {
      payload: { domain, name, workspace_attributes, company_attributes }
    } = data

    const client = new AttioClient(request)

    const company = await client.assertRecord({
      object: 'companies',
      matching_attribute: 'domains',
      values: {
        domains: domain,
        ...(company_attributes ?? {})
      }
    })

    return await client.assertRecord({
      object: 'workspaces',
      matching_attribute: 'name',
      values: {
        name,
        company: company.data.data.id.record_id,
        ...(workspace_attributes ?? {})
      }
    })
  }
}

export default action
