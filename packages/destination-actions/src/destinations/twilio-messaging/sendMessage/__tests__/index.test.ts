import { createTestIntegration } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'
import { CHANNELS, SENDER_TYPE } from '../constants'

const testDestination = createTestIntegration(Destination)

const defaultSettings = {
  accountSID: 'AC1234567890abcdef1234567890abcdef',
  authToken: 'test_auth_token',
  apiKeySID: 'test_api_key_sid',
  apiKeySecret: 'test_api_key_secret',
  region: 'us1'
}

describe('TwilioMessaging.sendMessage', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should send SMS with phone number sender', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        toPhoneNumber: '+1234567890',
        fromPhoneNumber: '+19876543210',
        contentTemplateType: 'Inline',
        inlineBody: 'Hello World!'
      }
    })
  })

  it('should send MMS with messaging service', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.MMS,
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        toPhoneNumber: '+1234567890',
        messagingServiceSid: 'Friendly Name [MG1234567890abcdef1234567890abcdef]',
        contentTemplateType: 'Inline',
        inlineBody: 'Hello World!',
        inlineMediaUrls: ['https://example.com/image.jpg']
      }
    })
  })

  it('should send WhatsApp message', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.WHATSAPP,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        toPhoneNumber: '+1234567890',
        fromPhoneNumber: '+19876543210',
        contentTemplateType: 'Inline',
        inlineBody: 'Hello from WhatsApp!'
      }
    })
  })

  it('should send message with content template', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        toPhoneNumber: '+1234567890',
        fromPhoneNumber: '+19876543210',
        contentTemplateType: 'Text',
        contentSid: 'Template Name [HX1234567890abcdef1234567890abcdef]',
        contentVariables: {
          first_name: 'John',
          last_name: 'Doe'
        }
      }
    })
  })

  it('should send SMS with messaging service and content template', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        toPhoneNumber: '+1234567890',
        messagingServiceSid: 'SMS Service [MG1234567890abcdef1234567890abcdef]',
        contentTemplateType: 'Text',
        contentSid: 'Template Name [HX1234567890abcdef1234567890abcdef]',
        contentVariables: {
          customer_name: 'Jane',
          order_total: '$99.99'
        }
      }
    })
  })

  it('should send MMS with phone number and inline template', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.MMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        toPhoneNumber: '+1234567890',
        fromPhoneNumber: '+19876543210',
        contentTemplateType: 'Inline',
        inlineBody: 'Check out this image!',
        inlineMediaUrls: ['https://example.com/product.jpg', 'https://example.com/details.pdf']
      }
    })
  })

  it('should send WhatsApp with messaging service', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.WHATSAPP,
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        toPhoneNumber: '+1234567890',
        messagingServiceSid: 'WhatsApp Service [MG9876543210fedcba9876543210fedcba]',
        contentTemplateType: 'Inline',
        inlineBody: 'Hello from WhatsApp via Messaging Service!'
      }
    })
  })

  it('should send SMS with phone number and validity period', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'sent'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.SMS,
        senderType: SENDER_TYPE.PHONE_NUMBER,
        toPhoneNumber: '+1234567890',
        fromPhoneNumber: '+19876543210',
        contentTemplateType: 'Inline',
        inlineBody: 'Time-sensitive message!',
        validityPeriod: 3600
      }
    })
  })

  it('should send MMS with messaging service and scheduled send', async () => {
    nock('https://api.twilio.com').post(`/2010-04-01/Accounts/${defaultSettings.accountSID}/Messages.json`).reply(200, {
      sid: 'SM1234567890abcdef1234567890abcdef',
      status: 'scheduled'
    })

    await testDestination.testAction('sendMessage', {
      settings: defaultSettings,
      mapping: {
        channel: CHANNELS.MMS,
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        toPhoneNumber: '+1234567890',
        messagingServiceSid: 'Scheduled Service [MG5555555555bbbbbb5555555555bbbbbb]',
        contentTemplateType: 'Inline',
        inlineBody: 'Scheduled message with media',
        inlineMediaUrls: ['https://example.com/scheduled-image.png'],
        sendAt: '2025-12-31T23:59:59Z'
      }
    })
  })

  it('should throw error for invalid phone number format', async () => {
    await expect(
      testDestination.testAction('sendMessage', {
        settings: defaultSettings,
        mapping: {
          channel: CHANNELS.SMS,
          senderType: SENDER_TYPE.PHONE_NUMBER,
          toPhoneNumber: 'invalid-phone',
          fromPhoneNumber: '+19876543210',
          contentTemplateType: 'Inline',
          inlineBody: 'Hello World!'
        }
      })
    ).rejects.toThrow(PayloadValidationError)
  })

  it('should throw error for missing from phone number', async () => {
    await expect(
      testDestination.testAction('sendMessage', {
        settings: defaultSettings,
        mapping: {
          channel: CHANNELS.SMS,
          senderType: SENDER_TYPE.PHONE_NUMBER,
          toPhoneNumber: '+1234567890',
          contentTemplateType: 'Inline',
          inlineBody: 'Hello World!'
        }
      })
    ).rejects.toThrow(PayloadValidationError)
  })

  it('should throw error for missing messaging service SID', async () => {
    await expect(
      testDestination.testAction('sendMessage', {
        settings: defaultSettings,
        mapping: {
          channel: CHANNELS.SMS,
          senderType: SENDER_TYPE.MESSAGING_SERVICE,
          toPhoneNumber: '+1234567890',
          contentTemplateType: 'Inline',
          inlineBody: 'Hello World!'
        }
      })
    ).rejects.toThrow(PayloadValidationError)
  })

  it('should throw error for too many media URLs', async () => {
    const manyUrls = Array.from({ length: 11 }, (_, i) => `https://example.com/image${i}.jpg`)

    await expect(
      testDestination.testAction('sendMessage', {
        settings: defaultSettings,
        mapping: {
          channel: CHANNELS.MMS,
          senderType: SENDER_TYPE.PHONE_NUMBER,
          toPhoneNumber: '+1234567890',
          fromPhoneNumber: '+19876543210',
          contentTemplateType: 'Inline',
          inlineBody: 'Hello World!',
          inlineMediaUrls: manyUrls
        }
      })
    ).rejects.toThrow(PayloadValidationError)
  })
})
