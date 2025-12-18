import { getSendAt, getSender } from '../utils'
import { PayloadValidationError } from '@segment/actions-core'
import { Payload } from '../generated-types'
import { SENDER_TYPE } from '../constants'

describe('Functions should work correctly', () => {
  describe('getSendAt', () => {
    it('getSendAt works when passed valid timestamp string', async () => {
      const twentyMinutesFromNow = new Date(Date.now() + 20 * 60 * 1000).toISOString()
      let sendAt = getSendAt(twentyMinutesFromNow)
      expect(sendAt).toEqual({ SendAt: twentyMinutesFromNow, ScheduleType: 'fixed' })

      const thirtyFourDaysFromNow = new Date(Date.now() + 34 * 24 * 60 * 60 * 1000).toISOString()
      sendAt = getSendAt(thirtyFourDaysFromNow)
      expect(sendAt).toEqual({ SendAt: thirtyFourDaysFromNow, ScheduleType: 'fixed' })
    })

    it('getSendAt throws error when less than 15 minutes into the future', async () => {
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString()
      expect(() => getSendAt(tenMinutesFromNow)).toThrow(PayloadValidationError)
      expect(() => getSendAt(tenMinutesFromNow)).toThrow(
        /'Send At' time of .* is invalid\. It must be at least 15 minutes and at most 35 days in the future\./
      )
    })

    it('getSendAt does not throw error when string is not a valid date', async () => {
      // @ts-expect-error
      const sendAt = getSendAt(null)
      expect(sendAt).toEqual({})

      const sendAt2 = getSendAt('')
      expect(sendAt2).toEqual({})
    })

    it('getSendAt throws error when more than 35 days into the future', async () => {
      const thirtySixDaysFromNow = new Date(Date.now() + 36 * 24 * 60 * 60 * 1000).toISOString()
      expect(() => getSendAt(thirtySixDaysFromNow)).toThrow(PayloadValidationError)
      expect(() => getSendAt(thirtySixDaysFromNow)).toThrow(
        /'Send At' time of .* is invalid\. It must be at least 15 minutes and at most 35 days in the future\./
      )
    })
  })

  describe('getSender', () => {
    it('getSender is correct when passed SENDER_TYPE = MESSAGING_SERVICE with sendAt', async () => {
      const d = new Date(Date.now() + 20 * 60 * 1000) // 20 minutes from now

      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        messagingServiceSid: 'MG0123456789abcdef0123456789abcdef',
        sendAt: d.toISOString()
      }

      const validSender = getSender(payload as Payload)

      expect(validSender).toEqual({
        MessagingServiceSid: 'MG0123456789abcdef0123456789abcdef',
        ScheduleType: 'fixed',
        SendAt: d.toISOString()
      })
    })

    it('getSender is correct when passed SENDER_TYPE = MESSAGING_SERVICE with empty sendAt', async () => {
      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        messagingServiceSid: 'MG0123456789abcdef0123456789abcdef',
        sendAt: ''
      }

      const validSender = getSender(payload as Payload)

      expect(validSender).toEqual({
        MessagingServiceSid: 'MG0123456789abcdef0123456789abcdef'
      })
    })

    it('getSender is correct when passed SENDER_TYPE = MESSAGING_SERVICE with undefined sendAt', async () => {
      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        messagingServiceSid: 'MG0123456789abcdef0123456789abcdef',
        sendAt: undefined
      }

      const validSender = getSender(payload as Payload)

      expect(validSender).toEqual({
        MessagingServiceSid: 'MG0123456789abcdef0123456789abcdef'
      })
    })

    it('getSender is correct when passed SENDER_TYPE = MESSAGING_SERVICE with null sendAt', async () => {
      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        messagingServiceSid: 'MG0123456789abcdef0123456789abcdef',
        // ignore null case in TS but test it anyway
        // @ts-expect-error
        sendAt: null
      }

      const validSender = getSender(payload as Payload)

      expect(validSender).toEqual({
        MessagingServiceSid: 'MG0123456789abcdef0123456789abcdef'
      })
    })

    it('getSender is correct when passed SENDER_TYPE = MESSAGING_SERVICE without sendAt', async () => {
      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        messagingServiceSid: 'MG0123456789abcdef0123456789abcdef'
      }
      const validSender = getSender(payload as Payload)

      expect(validSender).toEqual({
        MessagingServiceSid: 'MG0123456789abcdef0123456789abcdef'
      })
    })

    it('getSender is correct when passed SENDER_TYPE = FACEBOOK_PAGE_ID', async () => {
      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.FACEBOOK_PAGE_ID,
        fromFacebookPageId: '1234567890'
      }
      const validSender = getSender(payload as Payload)

      expect(validSender).toEqual({
        From: 'messenger:1234567890'
      })
    })

    it('getSender is correct when passed SENDER_TYPE = PHONE_NUMBER', async () => {
      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.PHONE_NUMBER,
        fromPhoneNumber: '+1234567890'
      }
      const validSender = getSender(payload as Payload)

      expect(validSender).toEqual({
        From: '+1234567890'
      })
    })

    it('getSender throws error with bad SENDER_TYPE = MESSAGING_SERVICE value', async () => {
      const payload: Partial<Payload> = {
        senderType: SENDER_TYPE.MESSAGING_SERVICE,
        messagingServiceSid: 'BADVALUE0123456789abcdef0123456789abcdef'
      }
      expect(() => getSender(payload as Payload)).toThrow(PayloadValidationError)
      expect(() => getSender(payload as Payload)).toThrow(
        "'Messaging Service SID' field value should start with 'MG' followed by 32 hexadecimal characters, totaling 34 characters."
      )
    })
  })
})
