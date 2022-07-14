import { InputField } from '@segment/actions-core/src/destination-kit/types'

export const customerProfileId: InputField = {
  label: 'Customer Profile ID',
  description: 'The customer profile integration identifier to use in Talon.One.',
  type: 'string',
  required: true,
  default: {
    '@path': '$.userId'
  }
}

export const attribute: InputField = {
  label: 'Attribute-Value pairs',
  description:
    'Extra attributes associated with the customer profile. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).',
  type: 'object',
  required: false,
  default: {
    '@path': '$.traits'
  }
}

export const audienceId: InputField = {
  label: 'Audience IDs (the label must not be used)',
  description: 'You should get these audience IDs from Talon.One.',
  type: 'integer',
  multiple: true,
  required: false
}

export const addAudienceId: InputField = {
  ...audienceId,
  label: 'List of audience ID to associate with the customer profile.'
}

export const deleteAudienceId: InputField = {
  ...audienceId,
  label: 'List of audience ID to dissociate with the customer profile.'
}

export const audience: InputField = {
  label: 'Audience (the label must not be used)',
  description: 'Audience name and integration ID',
  type: 'object',
  properties: {
    name: {
      label: 'Name',
      description: 'The audience name.',
      type: 'string',
      required: true
    },
    integrationId: {
      label: 'integrationID',
      description: 'The audience integration ID.',
      type: 'string',
      required: false
    }
  },
  multiple: true,
  required: false
}

export const audiencesToAdd: InputField = {
  ...audience,
  label: 'The audiences for the customer to join.',
  default: {
    '@arrayPath': [
      '$.properties.audiencesToAdd',
      {
        name: {
          '@path': '$.name'
        },
        integrationId: {
          '@path': '$.integrationId'
        }
      }
    ]
  }
}

export const audiencesToDelete: InputField = {
  ...audience,
  label: 'The audiences for the customer to leave.',
  default: {
    '@arrayPath': [
      '$.properties.audiencesToDelete',
      {
        name: {
          '@path': '$.name'
        },
        integrationId: {
          '@path': '$.integrationId'
        }
      }
    ]
  }
}

export const attributesInfo: InputField = {
  label: 'Attributes info',
  description: 'Use this field if you want to identify an attribute with a specific type',
  type: 'object',
  required: false,
  multiple: true,
  properties: {
    name: {
      label: 'Name',
      description: 'Attribute name',
      type: 'string',
      required: true
    },
    type: {
      label: 'Type',
      description: 'Attribute type. Can be only `string`, `time`, `number`, `boolean`, `location`',
      type: 'string',
      required: true,
      choices: [
        { label: 'String', value: 'string' },
        { label: 'Time', value: 'time' },
        { label: 'Number', value: 'number' },
        { label: 'Boolean', value: 'boolean' },
        { label: 'Location', value: 'location' }
      ]
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.attributesInfo',
      {
        name: {
          '@path': '$.name'
        },
        type: {
          '@path': '$.type'
        }
      }
    ]
  }
}
