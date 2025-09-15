import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('deleteDevice', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with default mappings when userId is supplied', async () => {
        const userId = 'abc123'
        const deviceId = 'device_123'
        const event = createTestEvent({
          userId,
          context: {
            device: {
              token: deviceId
            }
          }
        })
        const response = await action('deleteDevice', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'delete_device',
          device: {
            token: deviceId
          },
          identifiers: {
            id: userId
          },
          type: 'person'
        })
      })
    })
  })
})
