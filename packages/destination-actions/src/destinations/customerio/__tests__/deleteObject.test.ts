import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('deleteObject', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with default mappings when groupId is supplied', async () => {
        const groupId = 'group_123'
        const objectTypeId = 'type_123'
        const event = createTestEvent({
          properties: {
            objectTypeId,
            objectId: groupId
          }
        })
        const response = await action('deleteObject', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'delete',
          identifiers: {
            object_id: groupId,
            object_type_id: objectTypeId
          },
          type: 'object'
        })
      })
    })
  })
})
