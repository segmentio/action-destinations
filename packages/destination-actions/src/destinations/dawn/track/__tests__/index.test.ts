import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import { Payload } from '../generated-types'
import action from '../index' // Replace with the actual file name

describe('Dawn AI Action', () => {
  let mockRequest: jest.MockedFunction<RequestClient>
  let mockSettings: Settings
  let mockPayload: Payload

  beforeEach(() => {
    mockRequest = jest.fn().mockResolvedValue({ status: 200 })
    mockSettings = {
      writeKey: 'test-write-key'
    }
    mockPayload = {
      event: 'test-event',
      user_id: 'test-user-id',
      properties: { key: 'value' }
    }
  })

  describe('perform function', () => {
    it('should correctly transform payload and make API call', async () => {
      await action.perform(mockRequest, { settings: mockSettings, payload: mockPayload })
      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.dawnai.com/segment-track',
        expect.objectContaining({
          method: 'post',
          json: [
            {
              event: 'test-event',
              user_id: 'test-user-id',
              properties: { key: 'value' }
            }
          ],
          headers: {
            authorization: 'Bearer test-write-key'
          }
        })
      )
    })

    it('should handle missing user_id and properties', async () => {
      const incompletePayload: Payload = { event: 'test-event', user_id: '', properties: {} }
      await action.perform(mockRequest, { settings: mockSettings, payload: incompletePayload })
      expect(mockRequest).toHaveBeenCalledWith(
        'https://api.dawnai.com/segment-track',
        expect.objectContaining({
          json: [
            {
              event: 'test-event',
              user_id: '',
              properties: {}
            }
          ]
        })
      )
    })
  })

  describe('action definition', () => {
    it('should have correct field definitions', () => {
      expect(action.fields).toHaveProperty('event')
      expect(action.fields).toHaveProperty('user_id')
      expect(action.fields).toHaveProperty('properties')

      expect(action.fields.event.required).toBe(true)
      expect(action.fields.user_id.required).toBe(true)
      expect(action.fields.properties.required).toBe(false)
    })
  })
})
