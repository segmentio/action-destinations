import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { getDefaultMappings, testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('createUpdateObject', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with default mappings when userId is supplied', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales',
            industry: 'Technology',
            created_at: timestamp
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          industry: 'Technology',
          created_at: dayjs.utc(timestamp).unix()
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: traits.object_type_id,
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { id: userId } }]
        })
      })

      it('should work with anonymous id when userId is not supplied', async () => {
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales',
            created_at: timestamp
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          created_at: dayjs.utc(timestamp).unix()
        }
        const event = createTestEvent({
          userId: undefined,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify_anonymous',
          identifiers: {
            object_type_id: traits.object_type_id,
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { anonymous_id: anonymousId } }]
        })
      })

      it('should work with object_type_id given in the traits', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '2',
          objectAttributes: {
            name: 'Sales',
            created_at: timestamp
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          created_at: dayjs.utc(timestamp).unix()
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: '2',
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { id: userId } }]
        })
      })

      it('should work with default object_type_id when object_type_id is not supplied', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          objectAttributes: {
            name: 'Sales',
            created_at: timestamp
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          created_at: dayjs.utc(timestamp).unix()
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: '1',
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { id: userId } }]
        })
      })

      it('should work with default object_type_id if traits are not supplied', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const attributes = {
          anonymous_id: anonymousId
        }

        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          groupId,
          traits: undefined
        })

        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: '1',
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { id: userId } }]
        })
      })

      it('should work if userId starts with `cio_`', async () => {
        const userId = 'cio_abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const typeId = '1'
        const attributes = {
          anonymous_id: anonymousId
        }

        const event = createTestEvent({
          userId,
          anonymousId,
          groupId,
          traits: {
            objectTypeId: typeId
          },
          timestamp
        })

        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: '1',
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { cio_id: 'abc123' } }]
        })
      })

      it('should work if userId is an email', async () => {
        const userId = 'foo@bar.com'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const typeId = '1'
        const attributes = {
          anonymous_id: anonymousId
        }

        const event = createTestEvent({
          userId,
          anonymousId,
          groupId,
          traits: {
            objectTypeId: typeId
          },
          timestamp
        })

        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: '1',
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { email: 'foo@bar.com' } }]
        })
      })

      it('should work when no created_at is given', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const typeId = '1'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales'
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales'
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: typeId,
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { id: userId } }]
        })
      })

      it('should work with anonymous id when userId is not supplied', async () => {
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales',
            createdAt: timestamp
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          createdAt: dayjs.utc(timestamp).unix()
        }
        const event = createTestEvent({
          userId: undefined,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify_anonymous',
          identifiers: {
            object_type_id: traits.object_type_id,
            object_id: groupId
          },
          cio_relationships: [{ identifiers: { anonymous_id: anonymousId } }]
        })
      })

      it('should work with relationship traits', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales',
            createdAt: timestamp
          },
          relationshipAttributes: {
            role: 'admin',
            prefix: 'Mr.'
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          createdAt: dayjs.utc(timestamp).unix()
        }

        const relationship = {
          identifiers: { id: userId },
          relationship_attributes: {
            role: 'admin',
            prefix: 'Mr.'
          }
        }

        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: traits.object_type_id,
            object_id: groupId
          },
          cio_relationships: [relationship]
        })
      })

      it('should work with relationship traits having timestamp attributes', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales',
            createdAt: timestamp
          },
          relationshipAttributes: {
            role: 'admin',
            createdAt: timestamp
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          createdAt: dayjs.utc(timestamp).unix()
        }

        const relationship = {
          identifiers: { id: userId },
          relationship_attributes: {
            role: 'admin',
            createdAt: dayjs.utc(timestamp).unix()
          }
        }

        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: traits.object_type_id,
            object_id: groupId
          },
          cio_relationships: [relationship]
        })
      })

      it('should work with relationship traits and anonymous user', async () => {
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales',
            createdAt: timestamp
          },
          relationshipAttributes: {
            role: 'admin',
            createdAt: timestamp
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          createdAt: dayjs.utc(timestamp).unix()
        }

        const relationship = {
          identifiers: { anonymous_id: anonymousId },
          relationship_attributes: {
            role: 'admin',
            createdAt: dayjs.utc(timestamp).unix()
          }
        }

        const event = createTestEvent({
          userId: undefined,
          anonymousId,
          timestamp,
          traits,
          groupId
        })
        const response = await action('createUpdateObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify_anonymous',
          identifiers: {
            object_type_id: traits.object_type_id,
            object_id: groupId
          },
          cio_relationships: [relationship]
        })
      })

      it('should work if `relationship_attributes` is unmapped', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'grp123'
        const traits = {
          object_type_id: '1',
          objectAttributes: {
            name: 'Sales',
            createdAt: timestamp
          },
          relationshipAttributes: {
            role: 'admin',
            prefix: 'Mr.'
          }
        }

        const attributes = {
          anonymous_id: anonymousId,
          name: 'Sales',
          createdAt: dayjs.utc(timestamp).unix()
        }

        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits,
          groupId
        })

        const mapping = getDefaultMappings('createUpdateObject')

        // Ensure event_id is not mapped, such as for previous customers who have not updated their mappings.
        delete mapping.relationship_attributes

        const response = await action('createUpdateObject', { event, mapping, settings })

        expect(response).toEqual({
          attributes: attributes,
          type: 'object',
          action: 'identify',
          identifiers: {
            object_type_id: traits.object_type_id,
            object_id: groupId
          },
          cio_relationships: [
            {
              identifiers: { id: userId }
            }
          ]
        })
      })
    })
  })
})
