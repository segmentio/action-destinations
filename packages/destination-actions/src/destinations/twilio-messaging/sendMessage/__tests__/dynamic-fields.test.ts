import {
  dynamicSenderType,
  dynamicFromPhoneNumber,
  dynamicMessagingServiceSid,
  dynamicContentTemplateType,
  dynamicContentSid,
  dynamicContentVariables
} from '../dynamic-fields'
import { CHANNELS, SENDER_TYPE } from '../constants'
import { RequestClient } from '@segment/actions-core'

const mockSettings = {
  accountSID: 'AC1234567890abcdef1234567890abcdef',
  authToken: 'test_auth_token',
  apiKeySID: 'test_api_key_sid',
  apiKeySecret: 'test_api_key_secret',
  region: 'us1'
}

describe('Dynamic Fields', () => {
  describe('dynamicSenderType', () => {
    it('should return phone number and messaging service for other channels', async () => {
      const result = await dynamicSenderType({
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        contentTemplateType: 'Inline'
      } as any)

      expect(result.choices).toHaveLength(2)
      expect(result.choices).toContainEqual({
        label: SENDER_TYPE.PHONE_NUMBER,
        value: SENDER_TYPE.PHONE_NUMBER
      })
      expect(result.choices).toContainEqual({
        label: SENDER_TYPE.MESSAGING_SERVICE,
        value: SENDER_TYPE.MESSAGING_SERVICE
      })
    })

    it('should return error when no channel is selected', async () => {
      const result = await dynamicSenderType({
        senderType: SENDER_TYPE.PHONE_NUMBER,
        contentTemplateType: 'Inline'
      } as any)

      expect(result.error).toBeDefined()
      if (result.error) {
        expect(result.error.message).toBe("Select from 'Channel' field first.")
      }
    })
  })

  describe('dynamicFromPhoneNumber', () => {
    const mockRequest = jest.fn() as unknown as RequestClient

    it('should return error for WhatsApp channel', async () => {
      const result = await dynamicFromPhoneNumber(
        mockRequest,
        {
          channel: CHANNELS.WHATSAPP,
          senderType: SENDER_TYPE.PHONE_NUMBER,
          contentTemplateType: 'Inline'
        } as any,
        mockSettings
      )

      expect(result.error).toBeDefined()
      if (result.error) {
        expect(result.error.message).toBe(
          'For WhatsApp channel, please manually enter your WhatsApp Business phone number in E.164 format.'
        )
      }
    })

    it('should return error for RCS channel', async () => {
      const result = await dynamicFromPhoneNumber(
        mockRequest,
        {
          channel: CHANNELS.RCS,
          senderType: SENDER_TYPE.PHONE_NUMBER,
          contentTemplateType: 'Inline'
        } as any,
        mockSettings
      )

      expect(result.error).toBeDefined()
      if (result.error) {
        expect(result.error.message).toBe('Please manually enter your RCS phone number in E.164 format.')
      }
    })

    it('should return phone numbers for SMS channel', async () => {
      const mockPhoneNumbersResponse = {
        data: {
          incoming_phone_numbers: [
            {
              phone_number: '+1234567890',
              capabilities: { sms: true, mms: false, rcs: false }
            },
            {
              phone_number: '+19876543210',
              capabilities: { sms: true, mms: true, rcs: false }
            }
          ]
        }
      }

      const mockRequestFn = jest.fn().mockResolvedValue(mockPhoneNumbersResponse) as unknown as RequestClient

      const result = await dynamicFromPhoneNumber(
        mockRequestFn,
        {
          channel: CHANNELS.SMS,
          senderType: SENDER_TYPE.PHONE_NUMBER,
          contentTemplateType: 'Inline'
        } as any,
        mockSettings
      )

      expect(result.choices).toHaveLength(2) // 2 phone numbers
      expect(result.choices).toContainEqual({ label: '+1234567890', value: '+1234567890' })
      expect(result.choices).toContainEqual({ label: '+19876543210', value: '+19876543210' })
    })
  })

  describe('dynamicMessagingServiceSid', () => {
    it('should return messaging services', async () => {
      const mockResponse = {
        data: {
          services: [
            {
              account_sid: 'AC123',
              friendly_name: 'Test Service',
              sid: 'test'
            }
          ]
        }
      }

      const mockRequestFn = jest.fn().mockResolvedValue(mockResponse) as unknown as RequestClient
      const result = await dynamicMessagingServiceSid(mockRequestFn, mockSettings)

      expect(result.choices).toHaveLength(1)
      expect(result.choices[0]).toEqual({
        label: 'Test Service [test]',
        value: 'Test Service [test]'
      })
    })

    it('should return error when no messaging services found', async () => {
      const mockResponse = { data: { services: [] } }
      const mockRequestFn = jest.fn().mockResolvedValue(mockResponse) as unknown as RequestClient

      const result = await dynamicMessagingServiceSid(mockRequestFn, mockSettings)

      expect(result.error).toBeDefined()
      if (result.error) {
        expect(result.error.message).toBe(
          'No Messaging Services found. Please create a Messaging Service in your Twilio account.'
        )
      }
    })
  })

  describe('dynamicContentTemplateType', () => {
    it('should return content template types for given channel', async () => {
      const result = await dynamicContentTemplateType({
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        contentTemplateType: 'Inline'
      } as any)

      expect(result.choices).toBeDefined()
      expect(result.choices.length).toBeGreaterThan(0)
      expect(result.choices.some((choice) => choice.label === 'Inline')).toBe(true)
    })

    it('should return error when no channel is selected', async () => {
      const result = await dynamicContentTemplateType({
        senderType: SENDER_TYPE.PHONE_NUMBER,
        contentTemplateType: 'Inline'
      } as any)

      expect(result.error).toBeDefined()
      if (result.error) {
        expect(result.error.message).toBe("Select from 'Channel' field first.")
      }
    })
  })

  describe('dynamicContentSid', () => {
    it('should return error for inline content template type', async () => {
      const mockRequestFn = jest.fn() as unknown as RequestClient
      const result = await dynamicContentSid(mockRequestFn, {
        contentTemplateType: 'Inline',
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER
      } as any)

      expect(result.error).toBeDefined()
      if (result.error) {
        expect(result.error.message).toBe("Inline messages do not use 'pre-defined' Content Templates.")
      }
    })

    it('should return content templates', async () => {
      const mockResponse = {
        data: {
          contents: [
            {
              friendly_name: 'Test Template',
              sid: 'test',
              types: {
                'twilio/text': {}
              }
            }
          ]
        }
      }

      const mockRequestFn = jest.fn().mockResolvedValue(mockResponse) as unknown as RequestClient
      const result = await dynamicContentSid(mockRequestFn, {
        contentTemplateType: 'Text',
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER
      } as any)

      expect(result.choices).toHaveLength(1)
      expect(result.choices[0]).toEqual({
        label: 'Test Template [test]',
        value: 'Test Template [test]'
      })
    })
  })

  describe('dynamicContentVariables', () => {
    it('should return error when no content SID is provided', async () => {
      const mockRequestFn = jest.fn() as unknown as RequestClient
      const result = await dynamicContentVariables(mockRequestFn, {
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        contentTemplateType: 'Text'
      } as any)

      expect(result.error).toBeDefined()
      if (result.error) {
        expect(result.error.message).toBe("Select from 'Content Template' field first")
      }
    })

    it('should return content variables', async () => {
      const mockResponse = {
        data: {
          types: {
            'twilio/text': {
              body: 'Hello {{first_name}}, your order {{order_id}} is ready!'
            }
          }
        }
      }

      const mockRequestFn = jest.fn().mockResolvedValue(mockResponse) as unknown as RequestClient
      const result = await dynamicContentVariables(mockRequestFn, {
        contentSid: 'test',
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        contentTemplateType: 'Text'
      } as any)

      expect(result.choices).toHaveLength(2)
      expect(result.choices).toContainEqual({ label: 'first_name', value: 'first_name' })
      expect(result.choices).toContainEqual({ label: 'order_id', value: 'order_id' })
    })
  })
})
