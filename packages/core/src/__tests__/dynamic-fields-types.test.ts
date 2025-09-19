import { ActionDefinition } from '../destination-kit/action'
import { InputField } from '../destination-kit/types'

// Test interfaces that mimic different dynamic field use-cases
interface PayloadWithRequiredObject {
  object_details: {
    object_type?: string
    id_field_name?: string
  }
}

interface PayloadWithOptionalObject {
  object_details: {
    object_type?: string
    id_field_name?: string
  }
  list_details?: {  
    /*
    This is the optional object field containing a required field (list_name). We want list_name have its own dynamic field, rather than relying on __keys__. 
    */
    list_name: string
  }
}

interface PayloadWithOptionalArray {
  associations?: Array<{
    object_type?: string
    id_field_name?: string
  }>
}

describe('Dynamic Fields Type System', () => {
  describe('TypeScript Compilation Tests', () => {
    test('should compile with required object fields', () => {
      const actionWithRequiredObject: ActionDefinition<{}, PayloadWithRequiredObject> = {
        title: 'Test Action',
        description: 'Test action with required object',
        fields: {
          object_details: {
            label: 'Object Details',
            description: 'Details about the object',
            type: 'object',
            required: true,
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField
        },
        dynamicFields: {
          object_details: {
            object_type: async () => ({ choices: [] }),
            id_field_name: async () => ({ choices: [] }),
            __keys__: async () => ({ choices: [] }),
            __values__: async () => ({ choices: [] })
          }
        },
        perform: async () => {}
      }

      expect(actionWithRequiredObject).toBeDefined()
    })

    test('should compile with optional object fields', () => {
      // This is what was broken before the NonNullable fix
      // and should now work after the fix
      const actionWithOptionalObject: ActionDefinition<{}, PayloadWithOptionalObject> = {
        title: 'Test Action',
        description: 'Test action with optional object',
        fields: {
          object_details: {
            label: 'Object Details',
            description: 'Details about the object',
            type: 'object',
            required: true,
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField,
          list_details: {
            label: 'List Details',
            description: 'Details about the list',
            type: 'object',
            required: false,  // This is the key - it's optional
            properties: {
              list_name: {
                label: 'List Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField
        },
        dynamicFields: {
          object_details: {
            object_type: async () => ({ choices: [] }),
            id_field_name: async () => ({ choices: [] })
          },
          list_details: {
            // This nested structure was failing before the fix
            list_name: async () => ({ choices: [] })
          }
        },
        perform: async () => {}
      }

      expect(actionWithOptionalObject).toBeDefined()
    })

    test('should compile with optional array fields', () => {
      // This should work for optional arrays too
      const actionWithOptionalArray: ActionDefinition<{}, PayloadWithOptionalArray> = {
        title: 'Test Action',
        description: 'Test action with optional array',
        fields: {
          associations: {
            label: 'Associations',
            description: 'Object associations',
            type: 'object',
            multiple: true,
            required: false,  // Optional array
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField
        },
        dynamicFields: {
          associations: {
            object_type: async () => ({ choices: [] }),
            id_field_name: async () => ({ choices: [] })
          }
        },
        perform: async () => {}
      }

      expect(actionWithOptionalArray).toBeDefined()
    })

    test('should support __keys__ and __values__ patterns', () => {
      // Test that the fallback patterns still work
      const actionWithFallbackPatterns: ActionDefinition<{}, PayloadWithOptionalObject> = {
        title: 'Test Action',
        description: 'Test action with fallback patterns',
        fields: {
          object_details: {
            label: 'Object Details',
            description: 'Details about the object',
            type: 'object',
            required: true,
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField,
          list_details: {
            label: 'List Details',
            description: 'Details about the list',
            type: 'object',
            required: false,
            properties: {
              list_name: {
                label: 'List Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField
        },
        dynamicFields: {
          list_details: {
            __keys__: async () => ({ choices: [] }),
            __values__: async () => ({ choices: [] })
          }
        },
        perform: async () => {}
      }

      expect(actionWithFallbackPatterns).toBeDefined()
    })

    test('should support mixed patterns', () => {
      // Test combining specific property handlers with fallback patterns
      const actionWithMixedPatterns: ActionDefinition<{}, PayloadWithOptionalObject> = {
        title: 'Test Action',
        description: 'Test action with mixed patterns',
        fields: {
          object_details: {
            label: 'Object Details',
            description: 'Details about the object',
            type: 'object',
            required: true,
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField,
          list_details: {
            label: 'List Details',
            description: 'Details about the list',
            type: 'object',
            required: false,
            properties: {
              list_name: {
                label: 'List Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField
        },
        dynamicFields: {
          list_details: {
            list_name: async () => ({ choices: [] }),  // Specific property handler
            __keys__: async () => ({ choices: [] }),     // Fallback for other keys
            __values__: async () => ({ choices: [] })    // Fallback for values
          }
        },
        perform: async () => {}
      }

      expect(actionWithMixedPatterns).toBeDefined()
    })
  })

  describe('Runtime Behavior Tests', () => {
    test('should execute dynamic field for optional object property', async () => {
      const mockDynamicHandler = jest.fn().mockResolvedValue({
        choices: [{ label: 'Test List', value: 'test_list' }]
      })

      const actionDefinition: ActionDefinition<{}, PayloadWithOptionalObject> = {
        title: 'Test Action',
        description: 'Test action',
        fields: {
          object_details: {
            label: 'Object Details',
            description: 'Details about the object',
            type: 'object',
            required: true,
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField,
          list_details: {
            label: 'List Details',
            description: 'Details about the list',
            type: 'object',
            required: false,
            properties: {
              list_name: {
                label: 'List Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField
        },
        dynamicFields: {
          list_details: {
            list_name: mockDynamicHandler
          }
        },
        perform: async () => {}
      }

      // This tests the actual execution path works correctly
      expect(actionDefinition.dynamicFields?.list_details?.list_name).toBeDefined()
      
      if (actionDefinition.dynamicFields?.list_details?.list_name) {
        const result = await actionDefinition.dynamicFields.list_details.list_name({} as any, {} as any)
        expect(result).toEqual({
          choices: [{ label: 'Test List', value: 'test_list' }]
        })
        expect(mockDynamicHandler).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Type Safety Tests', () => {
    test('should enforce correct function signatures', () => {
      // This test ensures the dynamic field functions have correct types
      const actionWithTypeEnforcement: ActionDefinition<{}, PayloadWithOptionalObject> = {
        title: 'Test Action',
        description: 'Test action with type enforcement',
        fields: {
          object_details: {
            label: 'Object Details',
            description: 'Details about the object',
            type: 'object',
            required: true,
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField,
          list_details: {
            label: 'List Details',
            description: 'Details about the list',
            type: 'object',
            required: false,
            properties: {
              list_name: {
                label: 'List Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField
        },
        dynamicFields: {
          list_details: {
            list_name: async (_request, { payload, settings }) => {
              // TypeScript should enforce these parameter types
              expectType<PayloadWithOptionalObject>(payload)
              expectType<{}>(settings)
              
              return { choices: [] }
            }
          }
        },
        perform: async () => {}
      }

      expect(actionWithTypeEnforcement).toBeDefined()
    })

    test('should demonstrate the exact HubSpot use case', () => {
      // This mirrors the exact structure that was failing in HubSpot
      interface HubSpotPayload {
        object_details: {
          object_type?: string
          id_field_name?: string  
          property_group?: string
        }
        list_details?: {
          list_name?: string
        }
        properties?: Record<string, any>
        sensitive_properties?: Record<string, any>
      }

      const hubspotAction: ActionDefinition<{}, HubSpotPayload> = {
        title: 'HubSpot Upsert Object',
        description: 'Create or update objects in HubSpot',
        fields: {
          object_details: {
            label: 'Object Details',
            description: 'Configuration for the HubSpot object',
            type: 'object',
            required: true,
            properties: {
              object_type: {
                label: 'Object Type',
                type: 'string',
                required: true,
                dynamic: true
              },
              id_field_name: {
                label: 'ID Field Name',
                type: 'string',
                required: true,
                dynamic: true
              },
              property_group: {
                label: 'Property Group',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField,
          list_details: {
            label: 'List Details',
            description: 'Configuration for HubSpot lists',
            type: 'object',
            required: false,  // This was the problematic optional object
            properties: {
              list_name: {
                label: 'List Name',
                type: 'string',
                dynamic: true
              }
            }
          } as InputField,
          properties: {
            label: 'Properties',
            description: 'Object properties',
            type: 'object',
            dynamic: true
          } as InputField,
          sensitive_properties: {
            label: 'Sensitive Properties',
            description: 'Sensitive object properties',
            type: 'object',
            dynamic: true
          } as InputField
        },
        dynamicFields: {
          object_details: {
            object_type: async () => ({ choices: [] }),
            id_field_name: async () => ({ choices: [] }),
            property_group: async () => ({ choices: [] })
          },
          // This was the failing part - nested structure with optional object
          list_details: {
            list_name: async () => ({ choices: [] })
          },
          properties: {
            __keys__: async () => ({ choices: [] })
          },
          sensitive_properties: {
            __keys__: async () => ({ choices: [] })
          }
        },
        perform: async () => {}
      }

      expect(hubspotAction).toBeDefined()
    })
  })
})

// Helper function for type testing (compile-time only)
function expectType<T>(_value: T): void {
  // This function is used only for compile-time type checking
  // It ensures that the passed value matches the expected type T
}