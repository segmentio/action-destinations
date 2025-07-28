import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('deletePerson', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with user id', async () => {
        const userId = 'user_123'
        const event = createTestEvent({
          userId: userId
        })
        const response = await action('deletePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'delete',
          identifiers: {
            id: userId
          },
          type: 'person',
          enable_batching: true,
          batch_size: 10
        })
      })

      it('should work with email', async () => {
        const email = 'foo@bar.com'
        const event = createTestEvent({
          userId: email
        })
        const response = await action('deletePerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'delete',
          identifiers: {
            email
          },
          type: 'person',
          enable_batching: true,
          batch_size: 10
        })
      })
    })
  })
})
