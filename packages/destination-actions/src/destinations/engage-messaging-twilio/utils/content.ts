import { RequestFn, ContentTemplateResponse } from './types'

export async function getTwilioContentTemplate(
  contentSid: string,
  twilioKey: string,
  twilioSecret: string,
  request: RequestFn
): Promise<ContentTemplateResponse> {
  const twilioToken = Buffer.from(`${twilioKey}:${twilioSecret}`).toString('base64')

  const response = await request(`https://content.twilio.com/v1/Content/${contentSid}`, {
    method: 'GET',
    headers: {
      authorization: `Basic ${twilioToken}`
    }
  })

  return response.json()
}
