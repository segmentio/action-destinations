// Test script to see what RCS payload would look like
// This simulates the utils.ts send function logic

const CHANNELS = {
  SMS: 'SMS',
  MMS: 'MMS',
  WHATSAPP: 'Whatsapp',
  MESSENGER: 'Messenger',
  RCS: 'RCS'
}

const SENDER_TYPE = {
  PHONE_NUMBER: 'Phone number',
  MESSENGER_SENDER_ID: 'Messenger Sender ID',
  MESSAGING_SERVICE: 'Messaging Service'
}

const ALL_CONTENT_TYPES = {
  INLINE: {
    friendly_name: 'Inline',
    supports_media: true
  }
}

// Simulate the payload processing for RCS
function simulateRCSPayload() {
  // Fake payload data for RCS
  const payload = {
    channel: CHANNELS.RCS,
    senderType: SENDER_TYPE.PHONE_NUMBER,
    toPhoneNumber: '+15551234567',
    fromPhoneNumber: '+15559876543',
    contentTemplateType: ALL_CONTENT_TYPES.INLINE.friendly_name,
    contentVariables: { first_name: 'John', last_name: 'Doe' },
    validityPeriod: 3600,
    sendAt: '2025-06-21T12:00:00Z',
    inlineMediaUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  }

  // Simulate getTo() for RCS
  const getTo = () => {
    const toPhoneNumber = payload.toPhoneNumber?.trim() ?? ''
    return toPhoneNumber // RCS uses plain phone number like SMS/MMS
  }

  // Simulate getSender() for RCS  
  const getSender = () => {
    const fromPhoneNumber = payload.fromPhoneNumber?.trim()
    return { From: fromPhoneNumber } // RCS uses plain phone number (not whatsapp: prefix)
  }

  // Simulate getContent()
  const getContent = () => {
    return {
      ContentSid: undefined, // Using inline content
      ContentVariables: JSON.stringify(payload.contentVariables)
    }
  }

  // Simulate getMediaUrl() for RCS
  const getMediaUrl = () => {
    const urls = payload.inlineMediaUrls
      ?.filter(item => item.trim() !== '')
      .map(item => item.trim()) ?? []
    
    return urls.length > 0 ? { MediaUrl: urls } : {}
  }

  // Simulate getSendAt()
  const getSendAt = () => payload.sendAt ? { SendAt: payload.sendAt } : {}

  // Simulate getValidityPeriod()
  const getValidityPeriod = () => payload.validityPeriod ? { ValidityPeriod: payload.validityPeriod } : {}

  // Build the final Twilio payload
  const twilioPayload = {
    To: getTo(),
    ...getSendAt(),
    ...getValidityPeriod(),
    ...getSender(),
    ...getContent(),
    ...getMediaUrl()
  }

  console.log('RCS Twilio Payload:')
  console.log(JSON.stringify(twilioPayload, null, 2))

  // Simulate URL encoding
  const encodedBody = new URLSearchParams()
  Object.entries(twilioPayload).forEach(([key, value]) => {
    if (key === 'MediaUrl' && Array.isArray(value)) {
      value.forEach((url) => {
        encodedBody.append('MediaUrl', url)
      })
    } else if (value !== undefined) {
      encodedBody.append(key, String(value))
    }
  })

  console.log('\nEncoded body that would be sent to Twilio:')
  console.log(encodedBody.toString())

  return twilioPayload
}

// Run the simulation
simulateRCSPayload()
