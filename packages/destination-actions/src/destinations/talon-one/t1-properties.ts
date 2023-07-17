import { InputField } from '@segment/actions-core/destination-kit/types'

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

export const cartItems: InputField = {
  label: 'Card Items',
  description:
    'The items to add to this sessions.\n' +
    '\n' +
    'If cart item flattening is disabled: Do not exceed 1000 items (regardless of their quantity) per request.\n' +
    "If cart item flattening is enabled: Do not exceed 1000 items and ensure the sum of all cart item's quantity does not exceed 10.000 per request.`",
  type: 'object',
  multiple: true,
  properties: {
    name: {
      label: 'Name',
      description: 'Name of item',
      type: 'string'
    },
    sku: {
      label: 'SKU',
      description: 'Stock keeping unit of item.',
      type: 'string'
    },
    quantity: {
      label: 'Quantity',
      description:
        'Quantity of item. Important: If you enabled cart item flattening, the quantity is always one and the same cart item might receive multiple per-item discounts. Ensure you can process multiple discounts on one cart item correctly.',
      type: 'number'
    },
    price: {
      label: 'Price',
      description: 'Price of item.',
      type: 'number'
    },
    returnedQuantity: {
      label: 'Returned quantity',
      description: 'Number of returned items, calculated internally based on returns of this item.',
      type: 'string'
    },
    remainingQuantity: {
      label: 'Remaining quantity',
      description: 'Remaining quantity of the item, calculated internally based on returns of this item.',
      type: 'string'
    },
    category: {
      label: 'Category',
      description: 'Type, group or model of the item.',
      type: 'string'
    },
    weight: {
      label: 'Weight',
      description: 'Weight of item in grams.',
      type: 'string'
    },
    height: {
      label: 'Height',
      description: 'Height of item in mm.',
      type: 'string'
    },
    length: {
      label: 'Length',
      description: 'Length of item in mm.',
      type: 'string'
    },
    position: {
      label: 'Position',
      description: 'Position of the Cart Item in the Cart (calculated internally).',
      type: 'string'
    },
    attributes: {
      ...attribute,
      default: {
        '@path': '$.properties.attributes'
      },
      description:
        'Use this property to set a value for the attributes of your choice. Attributes represent any information to attach to this cart item.\n' +
        '\n' +
        'Custom cart item attributes must be created in the Campaign Manager before you set them with this property.\n' +
        '\n' +
        '[See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).'
    },
    additionalCosts: {
      label: 'Additional Costs',
      description:
        'Use this property to set a value for the additional costs of this session, such as a shipping cost.`',
      type: 'object'
    }
  }
}
