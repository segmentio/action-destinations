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

const workspace_id: InputField = {
  type: 'string',
  label: 'ID',
  description: 'The ID of the Workspace',
  format: 'text',
  required: true,
  default: {
    '@if': {
      exists: { '@path': '$.context.groupId' },
      then: { '@path': '$.context.groupId' },
      else: { '@path': '$.id' }
    }
  }
}

const company_attributes: InputField = {
  type: 'object',
  label: 'Additional Company attributes',
  description:
    'Additional attributes to either set or update on the Attio Company Record. The values on the left should be ' +
    'Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. ' +
    'For example: traits.name → name',
  defaultObjectUI: 'keyvalue:only',
  default: {}
}

const workspace_attributes: InputField = {
  type: 'object',
  label: 'Additional Workspace attributes',
  description:
    'Additional attributes to either set or update on the Attio Workspace Record. The values on the left should be ' +
    'Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. ' +
    'For example: traits.name → name',
  defaultObjectUI: 'keyvalue:only',
  default: {}
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Workspace',
  description: 'Create or update an Attio Workspace and link it to a Company based on a domain attribute.',

  fields: {
    domain,
    workspace_id,
    company_attributes,
    workspace_attributes
  },

  perform: async (request, data) => {
    const {
      payload: { domain, workspace_id, workspace_attributes, company_attributes }
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
      matching_attribute: 'workspace_id',
      values: {
        workspace_id,
        company: company.data.data.id.record_id,
        ...(workspace_attributes ?? {})
      }
    })
  }
}

export default action
