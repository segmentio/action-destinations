    dynamic_structured_object: {
      label: 'Dynamic Structured Object',
      description: 'A dynamic structured object',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue',
      properties: {
        first_prop: {
          label: 'Key',
          type: 'string',
          required: true,
          dynamic: true
        },
        second_prop: {
          label: 'Value',
          type: 'string',
          required: true,
          choices: [
            { label: '0 secs', value: 0 },
            { label: '30 secs', value: 30 },
            { label: '120 secs', value: 120 }
          ]
        },
        third_prop: {
          label: 'Value',
          type: 'string',
          required: true
        }
      }
    },
    object_type: {
      // contacts, company, deals ( fetched from Hubspot)
      label: 'Object Type',
      description: 'The type of the object',
      type: 'string',
      required: true,
      dynamic: true
    },
    products: {
      label: 'Products',
      description: 'A list of products',
      type: 'object',
      multiple: true,
      properties: {
        price: {
          label: 'Price',
          type: 'number',
          required: true
        },
        sku: {
          label: 'SKU',
          type: 'string',
          required: true
        }
      }
    },
    product_associations: {
      type: 'object',
      properties: {
        association_type: {
          // deal <> sku
          label: 'Field',
          type: 'string',
          required: true
        },
        products: {
          // fetched from hubspot dynamically based on to_object_type
          label: 'Type',
          type: 'string',
          required: true
        },
        sku_field: {
          label: 'Value',
          type: 'string',
          required: true
        }
      }
    },
    event_properties: {
      type: 'object',
      mutliple: true,
      additionalProperties: true,
      properties: {
        property_name: {
          // dynamic dropdown in one tab and second tab type picker
          // deal <> sku
          label: 'Property Name',
          type: 'string',
          required: true
        },
        property_type: {
          label: 'Type',
          type: 'string',
          required: true,
          choices: [
            { label: 'string', value: 'string' },
            { label: 'number', value: 'number' }
          ]
        },
        property_value: {
          // payload picker
          label: 'Value',
          type: 'string',
          required: true
        }
      }
    },
    associations: {
      label: 'Dynamic Array of Objects',
      description: 'Create fields in target system',
      type: 'object',
      required: false,
      defaultObjectUI: 'arrayeditor',
      multiple: true,
      properties: {
        association_type: {
          // contacts <> company, contacts <> deals ( fetched from Hubspot)
          label: 'Field',
          type: 'string',
          required: true
        },
        to_id_field_name: {
          // fetched from hubspot dynamically based on to_object_type
          label: 'Type',
          type: 'string',
          required: true
        },
        to_id_field_value: {
          label: 'Value',
          type: 'string',
          required: true
        }
      }
    }