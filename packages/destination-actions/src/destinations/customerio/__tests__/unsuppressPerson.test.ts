import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('unsuppressPerson', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with user id', async () => {
        const userId = 'user_123'
        const event = createTestEvent({
          userId: userId
        })
        const response = await action('unsuppressPerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'unsuppress',
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })

      it('should work with email', async () => {
        const email = 'foo@bar.com'
        const event = createTestEvent({
          userId: email
        })
        const response = await action('unsuppressPerson', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'unsuppress',
          identifiers: {
            email
          },
          type: 'person'
        })
      })
    })
  })
})
