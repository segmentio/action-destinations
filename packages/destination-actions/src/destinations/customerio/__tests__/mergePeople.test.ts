import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('mergePeople', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should throw an error if `userId` or `previousId` are missing', async () => {
        const event = createTestEvent({
          userId: null,
          previousId: null
        })

        try {
          await action('mergePeople', {
            event,
            settings,
            useDefaultMappings: true
          })

          throw new Error('Expected an error to be thrown')
        } catch (e: any) {
          expect(e.message).toEqual(
            `The root value is missing the required field 'primary'. The root value is missing the required field 'secondary'.`
          )
        }
      })

      it('should not return `identifiers`', async () => {
        const event = createTestEvent({
          userId: 'abc123',
          previousId: 'def456'
        })
        const response = await action('mergePeople', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).not.toHaveProperty('identifiers')
      })

      it('should work if `userId` and `previousId` are provided', async () => {
        const event = createTestEvent({
          userId: 'abc123',
          previousId: 'def456'
        })
        const response = await action('mergePeople', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'merge',
          type: 'person',
          primary: {
            id: event.userId
          },
          secondary: {
            id: event.previousId
          }
        })
      })

      it('should work if `userId` is an email', async () => {
        const event = createTestEvent({
          userId: 'foo@bar.com',
          previousId: 'def456'
        })
        const response = await action('mergePeople', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'merge',
          type: 'person',
          primary: {
            email: event.userId
          },
          secondary: {
            id: event.previousId
          }
        })
      })

      it('should work if `userId` is a `cio_` identifier', async () => {
        const event = createTestEvent({
          userId: 'cio_123456',
          previousId: 'def456'
        })
        const response = await action('mergePeople', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'merge',
          type: 'person',
          primary: {
            cio_id: '123456'
          },
          secondary: {
            id: event.previousId
          }
        })
      })

      it('should work if `previousId` is an email', async () => {
        const event = createTestEvent({
          userId: 'id123',
          previousId: 'foo@bar.com'
        })
        const response = await action('mergePeople', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'merge',
          type: 'person',
          primary: {
            id: event.userId
          },
          secondary: {
            email: event.previousId
          }
        })
      })

      it('should work if `previousId` is a `cio_` identifier', async () => {
        const event = createTestEvent({
          userId: 'id123',
          previousId: 'cio_123456'
        })
        const response = await action('mergePeople', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'merge',
          type: 'person',
          primary: {
            id: event.userId
          },
          secondary: {
            cio_id: '123456'
          }
        })
      })
    })
  })
})
