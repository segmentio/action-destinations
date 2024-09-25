import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { getDefaultMappings, testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('createUpdatePerson', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with default mappings when userId is supplied', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          created_at: timestamp,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            created_at: dayjs.utc(timestamp).unix(),
            email: traits.email,
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should use email as the identifier if userId is an email', async () => {
        const anonymousId = 'unknown_123'
        const userId = 'foo@bar.com'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const traits = {
          full_name: 'Test User',
          created_at: timestamp,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            created_at: dayjs.utc(timestamp).unix(),
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          identifiers: {
            email: userId
          },
          type: 'person'
        })
      })

      it('should use email as the identifier if userId is not present', async () => {
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          created_at: timestamp,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId: null,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            email: traits.email,
            created_at: dayjs.utc(timestamp).unix(),
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          identifiers: {
            email: traits.email
          },
          type: 'person'
        })
      })

      it('should add anonymous_id to identifiers if supplied', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          created_at: timestamp,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            created_at: dayjs.utc(timestamp).unix(),
            email: traits.email,
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should convert only ISO-8601 strings', async () => {
        const userId = 'abc123'
        const timestamp = dayjs.utc().toISOString()
        const testTimestamps = {
          created_at: timestamp,
          date01: '25 Mar 2015',
          date02: 'Mar 25 2015',
          date03: '01/01/2019',
          date04: '2019-02-01',
          date05: '2007-01-02T18:04:07',
          date06: '2006-01-02T18:04:07Z',
          date07: '2006-01-02T18:04:07+01:00',
          date08: '2006-01-02T15:04:05.007',
          date09: '2006-01-02T15:04:05.007Z',
          date10: '2006-01-02T15:04:05.007+01:00',
          date11: '2018-03-04T12:08:56 PDT',
          date12: '2018-03-04T12:08:56.235 PDT',
          date13: '15/MAR/18',
          date14: '11-Jan-18',
          date15: '2006-01-02T15:04:05-0800',
          date16: '2006-01-02T15:04:05.07-0800',
          date17: '2006-01-02T15:04:05.007-0800'
        }
        const event = createTestEvent({
          userId,
          timestamp,
          traits: testTimestamps
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            anonymous_id: event.anonymousId,
            created_at: dayjs(timestamp).unix(),
            date01: testTimestamps.date01,
            date02: testTimestamps.date02,
            date03: testTimestamps.date03,
            date04: dayjs(testTimestamps.date04).unix(),
            date05: dayjs(testTimestamps.date05).unix(),
            date06: dayjs(testTimestamps.date06).unix(),
            date07: dayjs(testTimestamps.date07).unix(),
            date08: dayjs(testTimestamps.date08).unix(),
            date09: dayjs(testTimestamps.date09).unix(),
            date10: dayjs(testTimestamps.date10).unix(),
            date11: testTimestamps.date11,
            date12: testTimestamps.date12,
            date13: testTimestamps.date13,
            date14: testTimestamps.date14,
            date15: dayjs(testTimestamps.date15).unix(),
            date16: dayjs(testTimestamps.date16).unix(),
            date17: dayjs(testTimestamps.date17).unix()
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it("should not convert created_at if it's invalid", async () => {
        const userId = 'abc123'
        const timestamp = dayjs.utc().toISOString()
        const testTimestamps = {
          created_at: '2018-03-04T12:08:56.235 PDT'
        }
        const event = createTestEvent({
          userId,
          timestamp,
          traits: testTimestamps
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            anonymous_id: event.anonymousId,
            created_at: testTimestamps.created_at
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it("should not convert created_at if it's already a number", async () => {
        const userId = 'abc123'
        const timestamp = dayjs.utc().toISOString()
        const testTimestamps = {
          created_at: dayjs.utc(timestamp).unix().toString()
        }
        const event = createTestEvent({
          userId,
          timestamp,
          traits: testTimestamps
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            anonymous_id: event.anonymousId,
            created_at: testTimestamps.created_at
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should not convert attributes to unix timestamps when convert_timestamp is false', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          created_at: timestamp,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          mapping: {
            convert_timestamp: false
          },
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            email: traits.email,
            created_at: timestamp
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it("should not add created_at if it's not a trait", async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com'
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          mapping: {
            convert_timestamp: false
          },
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            email: traits.email
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should work with default mappings when userId and groupId are supplied', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const groupId = 'g12345'
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          created_at: timestamp,
          objectId: groupId,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            email: traits.email,
            created_at: dayjs.utc(timestamp).unix(),
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          cio_relationships: [
            {
              identifiers: { object_type_id: '1', object_id: groupId }
            }
          ],
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should work with object_type_id from traits when given', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const groupId = 'g12345'
        const traits: {
          objectId: string
          full_name: string
          email: string
          created_at: string
          object_type_id?: string
        } = {
          objectId: groupId,
          full_name: 'Test User',
          email: 'test@example.com',
          created_at: timestamp,
          object_type_id: '2'
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        delete traits.object_type_id
        expect(response).toEqual({
          action: 'identify',
          attributes: {
            ...traits,
            anonymous_id: anonymousId,
            email: traits.email,
            created_at: dayjs.utc(timestamp).unix()
          },
          identifiers: {
            id: userId
          },
          cio_relationships: [
            {
              identifiers: { object_type_id: '2', object_id: groupId }
            }
          ],
          type: 'person'
        })
      })

      it('should work if created_at is not given', async () => {
        const userId = 'abc123'
        const timestamp = dayjs.utc().toISOString()
        const event = createTestEvent({
          userId,
          timestamp,
          traits: {
            created_at: ''
          }
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            anonymous_id: event.anonymousId
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should work `traits.createdAt`', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          createdAt: timestamp,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            anonymous_id: anonymousId,
            created_at: dayjs.utc(timestamp).unix(),
            email: traits.email,
            full_name: traits.full_name,
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should work with relationship traits', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const groupId = 'g12345'
        const relationshipAttributes = {
          role: 'admin',
          prefix: 'Mr.'
        }
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          createdAt: timestamp,
          objectId: groupId,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          },
          relationshipAttributes
        }

        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })
        const response = await action('createUpdatePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'identify',
          attributes: {
            anonymous_id: anonymousId,
            created_at: dayjs.utc(timestamp).unix(),
            email: traits.email,
            objectId: groupId,
            full_name: traits.full_name,
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          cio_relationships: [
            {
              identifiers: { object_type_id: '1', object_id: groupId },
              relationship_attributes: relationshipAttributes
            }
          ],
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should work if `relationship_attributes` is unmapped', async () => {
        const userId = 'abc123'
        const anonymousId = 'unknown_123'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const groupId = 'g12345'
        const traits = {
          full_name: 'Test User',
          email: 'test@example.com',
          createdAt: timestamp,
          objectId: groupId,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          },
          relationshipAttributes: {
            role: 'admin',
            prefix: 'Mr.'
          }
        }
        const event = createTestEvent({
          userId,
          anonymousId,
          timestamp,
          traits
        })

        const mapping = getDefaultMappings('createUpdatePerson')

        // Ensure event_id is not mapped, such as for previous customers who have not updated their mappings.
        delete mapping.relationship_attributes

        const response = await action('createUpdatePerson', { event, mapping, settings })

        expect(response).toStrictEqual({
          action: 'identify',
          attributes: {
            anonymous_id: anonymousId,
            created_at: dayjs.utc(timestamp).unix(),
            email: traits.email,
            full_name: traits.full_name,
            objectId: groupId,
            person: {
              ...traits.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          cio_relationships: [
            {
              identifiers: { object_type_id: '1', object_id: groupId }
            }
          ],
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })
    })
  })
})
