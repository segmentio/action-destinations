import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('suppressPerson', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with user id', async () => {
        const userId = 'user_123'
        const event = createTestEvent({
          userId: userId
        })
        const response = await action('suppressPerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'suppress',
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
        const response = await action('suppressPerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'suppress',
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
