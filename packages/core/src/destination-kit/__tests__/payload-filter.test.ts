import { filterPayloadByDependsOn, filterPayloadByActionDefinition } from '../payload-filter'
import type { InputField } from '../types'

describe('payload-filter', () => {
  describe('filterPayloadByDependsOn', () => {
    it('should filter out fields that do not meet depends_on conditions with "is" operator', () => {
      const payload = {
        role: 'lead',
        external_id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      }

      const fields: Record<string, InputField> = {
        role: {
          type: 'string',
          label: 'Role',
          description: 'User role',
          required: true
        },
        external_id: {
          type: 'string',
          label: 'External ID',
          description: 'External user identifier',
          depends_on: {
            conditions: [
              {
                fieldKey: 'role',
                operator: 'is',
                value: 'user'
              }
            ]
          }
        },
        email: {
          type: 'string',
          label: 'Email',
          description: 'User email address'
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'User name'
        }
      }

      const result = filterPayloadByDependsOn(payload, fields)

      expect(result).toEqual({
        role: 'lead',
        email: 'test@example.com',
        name: 'Test User'
        // external_id should be filtered out because role is 'lead', not 'user'
      })
      expect(result).not.toHaveProperty('external_id')
    })

    it('should include fields when depends_on conditions are met with array values', () => {
      const payload = {
        operation: 'update',
        recordId: 'record123',
        data: { field: 'value' }
      }

      const fields: Record<string, InputField> = {
        operation: {
          type: 'string',
          label: 'Operation',
          description: 'The operation to perform',
          required: true
        },
        recordId: {
          type: 'string',
          label: 'Record ID',
          description: 'The record identifier',
          depends_on: {
            conditions: [
              {
                fieldKey: 'operation',
                operator: 'is',
                value: ['update', 'upsert', 'delete']
              }
            ]
          }
        },
        data: {
          type: 'object',
          label: 'Data',
          description: 'The data payload'
        }
      }

      const result = filterPayloadByDependsOn(payload, fields)

      expect(result).toEqual({
        operation: 'update',
        recordId: 'record123',
        data: { field: 'value' }
        // recordId should be included because operation 'update' is in the allowed array
      })
    })

    it('should handle "is_not" operator and "any" match mode correctly', () => {
      const payload = {
        userType: 'premium',
        basicFeature: 'enabled',
        premiumFeature: 'enabled',
        adminFeature: 'disabled'
      }

      const fields: Record<string, InputField> = {
        userType: {
          type: 'string',
          label: 'User Type',
          description: 'The type of user',
          required: true
        },
        basicFeature: {
          type: 'string',
          label: 'Basic Feature',
          description: 'Basic feature setting',
          depends_on: {
            match: 'any',
            conditions: [
              {
                fieldKey: 'userType',
                operator: 'is_not',
                value: 'guest'
              }
            ]
          }
        },
        premiumFeature: {
          type: 'string',
          label: 'Premium Feature',
          description: 'Premium feature setting',
          depends_on: {
            conditions: [
              {
                fieldKey: 'userType',
                operator: 'is',
                value: ['premium', 'admin']
              }
            ]
          }
        },
        adminFeature: {
          type: 'string',
          label: 'Admin Feature',
          description: 'Admin feature setting',
          depends_on: {
            conditions: [
              {
                fieldKey: 'userType',
                operator: 'is',
                value: 'admin'
              }
            ]
          }
        }
      }

      const result = filterPayloadByDependsOn(payload, fields)

      expect(result).toEqual({
        userType: 'premium',
        basicFeature: 'enabled',
        premiumFeature: 'enabled'
        // adminFeature should be filtered out because userType is 'premium', not 'admin'
      })
      expect(result).not.toHaveProperty('adminFeature')
    })
  })

  describe('filterPayloadByActionDefinition', () => {
    it('should work with action definition format', () => {
      const payload = {
        role: 'user',
        external_id: 'user123',
        email: 'test@example.com'
      }

      const actionDefinition = {
        fields: {
          role: {
            type: 'string' as const,
            label: 'Role',
            description: 'User role',
            required: true
          },
          external_id: {
            type: 'string' as const,
            label: 'External ID',
            description: 'External user identifier',
            depends_on: {
              conditions: [
                {
                  fieldKey: 'role',
                  operator: 'is' as const,
                  value: 'user'
                }
              ]
            }
          },
          email: {
            type: 'string' as const,
            label: 'Email',
            description: 'User email address'
          }
        }
      }

      const result = filterPayloadByActionDefinition(payload, actionDefinition)

      expect(result).toEqual({
        role: 'user',
        external_id: 'user123',
        email: 'test@example.com'
        // All fields should be included because role is 'user'
      })
    })
  })
})
