import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { eventDefinitionKey, contactKeyAPIEvent, eventData, dataExtensionHook } from '../sfmc-properties'
import type { Payload } from './generated-types'
import { SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION } from '../versioning-info'

// SCRATCH TEST — bug bash metadata round-trip test, not for merge. See /tmp/sfmc-hooks-bug-bash.md
// One inputField/outputType per FieldTypeName ('string' | 'text' | 'number' | 'integer' | 'datetime' | 'boolean' | 'password' | 'object')
// to stress-test the full type coverage through metadata.json -> action-destinations-bot flatten -> control-plane storage.
const typeCoverageInputFields = {
  test_type_string: {
    label: 'Test Type - String',
    description: 'Field type coverage test: string.',
    type: 'string' as const
  },
  test_type_text: {
    label: 'Test Type - Text',
    description: 'Field type coverage test: text.',
    type: 'text' as const
  },
  test_type_number: {
    label: 'Test Type - Number',
    description: 'Field type coverage test: number.',
    type: 'number' as const
  },
  test_type_integer: {
    label: 'Test Type - Integer',
    description: 'Field type coverage test: integer.',
    type: 'integer' as const
  },
  test_type_datetime: {
    label: 'Test Type - Datetime',
    description: 'Field type coverage test: datetime.',
    type: 'datetime' as const
  },
  test_type_boolean: {
    label: 'Test Type - Boolean',
    description: 'Field type coverage test: boolean.',
    type: 'boolean' as const
  },
  test_type_password: {
    label: 'Test Type - Password',
    description: 'Field type coverage test: password.',
    type: 'password' as const
  },
  test_type_object: {
    label: 'Test Type - Object',
    description: 'Field type coverage test: object.',
    type: 'object' as const,
    properties: {
      exampleKey: {
        label: 'Example Key',
        description: 'An example nested property.',
        type: 'string' as const
      }
    }
  }
}

const typeCoverageOutputTypes = {
  test_output_string: {
    label: 'Test Output - String',
    description: 'Output type coverage test: string.',
    type: 'string',
    required: false
  },
  test_output_text: {
    label: 'Test Output - Text',
    description: 'Output type coverage test: text.',
    type: 'text',
    required: false
  },
  test_output_number: {
    label: 'Test Output - Number',
    description: 'Output type coverage test: number.',
    type: 'number',
    required: false
  },
  test_output_integer: {
    label: 'Test Output - Integer',
    description: 'Output type coverage test: integer.',
    type: 'integer',
    required: false
  },
  test_output_datetime: {
    label: 'Test Output - Datetime',
    description: 'Output type coverage test: datetime.',
    type: 'datetime',
    required: false
  },
  test_output_boolean: {
    label: 'Test Output - Boolean',
    description: 'Output type coverage test: boolean.',
    type: 'boolean',
    required: false
  },
  test_output_password: {
    label: 'Test Output - Password',
    description: 'Output type coverage test: password.',
    type: 'password',
    required: false
  },
  test_output_object: {
    label: 'Test Output - Object',
    description: 'Output type coverage test: object.',
    type: 'object',
    required: false
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send API Event',
  description: 'Send events into an existing Event Definition in Salesforce Marketing Cloud.',
  fields: {
    eventDefinitionKey: eventDefinitionKey,
    contactKey: contactKeyAPIEvent,
    data: eventData
  },
  // SCRATCH TEST HOOK — bug bash metadata round-trip test, not for merge. See /tmp/sfmc-hooks-bug-bash.md
  hooks: {
    retlOnMappingSave: {
      ...dataExtensionHook,
      inputFields: {
        ...dataExtensionHook.inputFields,
        ...typeCoverageInputFields
      },
      outputTypes: {
        ...dataExtensionHook.outputTypes,
        ...typeCoverageOutputTypes
      }
    },
    onMappingSave: {
      ...dataExtensionHook,
      inputFields: {
        ...dataExtensionHook.inputFields,
        ...typeCoverageInputFields
      },
      outputTypes: {
        ...dataExtensionHook.outputTypes,
        ...typeCoverageOutputTypes
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return request(
      `https://${settings.subdomain}.rest.marketingcloudapis.com/interaction/${SALESFORCE_MARKETING_CLOUD_DATA_API_VERSION}/events`,
      {
        method: 'POST',
        json: payload
      }
    )
  }
}

export default action
