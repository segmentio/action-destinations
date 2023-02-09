// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Flow SID, starting with FW, for the Studio Flow to trigger.
   */
  flowSid: string
  /**
   * The Twilio phone number to initiate calls or messages from during the Flow Execution. Use [E.164](https://www.twilio.com/docs/glossary/what-e164) format (+1xxxxxxxxxx).
   */
  from: string
  /**
   * The amount of time during which the Flow can only be triggered once per Flow SID - User ID combination. Default is 60 seconds.
   */
  coolingOffPeriod?: number
  /**
   * A Distinct User ID
   */
  userId?: string
  /**
   * A Distinct External ID
   */
  anonymousId?: string
  /**
   * The type of the event being performed.
   */
  eventType: string
}
