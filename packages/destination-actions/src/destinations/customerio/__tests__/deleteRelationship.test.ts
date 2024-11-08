import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'
import { resolveIdentifiers } from '../utils'

describe('CustomerIO', () => {
  describe('deleteRelationship', () => {
    describe('when `groupId` and `objectTypeId` are present', () => {
      testRunner((settings: Settings, action: Function) => {
        it('should set type to `object`', async () => {
          const objectId = 'object_id123'
          const objectTypeId = 'object_type_id123'
          const event = createTestEvent({
            properties: {
              objectId: objectId,
              objectTypeId: objectTypeId
            }
          })

          const response = await action('deleteRelationship', {
            event,
            settings,
            useDefaultMappings: true
          })

          const expectedIdentifiers = resolveIdentifiers({
            anonymous_id: event.anonymousId,
            email: event.userId,
            person_id: event.userId
          })
          const expectedAttributes = (() => {
            if (expectedIdentifiers && 'anonymous_id' in expectedIdentifiers) {
              return {}
            }

            return { anonymous_id: event.anonymousId }
          })()

          expect(response).toEqual({
            action: 'delete_relationships',
            attributes: expectedAttributes,
            cio_relationships: [
              {
                identifiers: expectedIdentifiers
              }
            ],
            identifiers: {
              object_id: objectId,
              object_type_id: objectTypeId
            },
            type: 'object'
          })
        })

        it('should add cio_relationships with `object_id` and `object_type_id', async () => {
          const objectId = 'object_id123'
          const objectTypeId = 'object_type_id123'
          const event = createTestEvent({
            properties: {
              objectTypeId,
              objectId
            }
          })

          const response = await action('deleteRelationship', {
            event,
            settings,
            useDefaultMappings: true
          })

          expect(response).toMatchObject({
            action: 'delete_relationships',
            cio_relationships: [
              {
                identifiers: resolveIdentifiers({
                  anonymous_id: event.anonymousId,
                  email: event.userId,
                  person_id: event.userId
                })
              }
            ]
          })
        })
      })
    })

    testRunner((settings: Settings, action: Function) => {
      it('should throw an error if object_id is missing', async () => {
        const event = createTestEvent({ groupId: null, traits: { objectTypeId: null } })

        try {
          await action('deleteRelationship', {
            event,
            settings,
            useDefaultMappings: true
          })

          throw new Error('Expected an error to be thrown')
        } catch (e: any) {
          expect(e.message).toEqual(`The root value is missing the required field 'object_id'.`)
        }
      })

      it('should work if `userId` is an id', async () => {
        const event = createTestEvent({
          properties: {
            objectId: 'object_id123',
            objectTypeId: 'object_type_id123'
          },
          userId: '123'
        })

        const response = await action('deleteRelationship', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'delete_relationships',
          attributes: {
            anonymous_id: event.anonymousId
          },
          cio_relationships: [
            {
              identifiers: {
                id: event.userId
              }
            }
          ],
          identifiers: {
            object_id: event.properties?.objectId,
            object_type_id: event.properties?.objectTypeId
          },
          type: 'object'
        })
      })

      it('should work if `userId` is an email', async () => {
        const event = createTestEvent({
          properties: {
            objectTypeId: 'object_type_id123',
            objectId: 'object_id123'
          },
          userId: 'foo@bar.com'
        })

        const response = await action('deleteRelationship', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'delete_relationships',
          attributes: {
            anonymous_id: event.anonymousId
          },
          cio_relationships: [
            {
              identifiers: {
                email: event.userId
              }
            }
          ],
          identifiers: {
            object_id: event.properties?.objectId,
            object_type_id: event.properties?.objectTypeId
          },
          type: 'object'
        })
      })

      it('should work if `userId` is a `cio_` identifier', async () => {
        const event = createTestEvent({
          properties: {
            objectId: 'object_id123',
            objectTypeId: 'object_type_id123'
          },
          userId: 'cio_456'
        })

        const response = await action('deleteRelationship', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'delete_relationships',
          attributes: {
            anonymous_id: event.anonymousId
          },
          cio_relationships: [
            {
              identifiers: {
                cio_id: '456'
              }
            }
          ],
          identifiers: {
            object_id: event.properties?.objectId,
            object_type_id: event.properties?.objectTypeId
          },
          type: 'object'
        })
      })
    })
  })
})
