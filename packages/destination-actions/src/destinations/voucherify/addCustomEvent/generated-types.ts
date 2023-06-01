// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This is an object containing information about the [customer](https://docs.voucherify.io/reference/the-customer-object).
   */
  customer?: {
    source_id?: string
    email?: string
  }
  /**
   * If a conversion event for a referral program is set to a [custom event](https://docs.voucherify.io/reference/custom-event-object), then you need to send the referral code in the payload to make a record of the conversion event.
   */
  referral?: {
    code?: string
    referrer_id?: string
  }
  /**
   * If an earning rule in a loyalty program is based on a [custom event](https://docs.voucherify.io/reference/custom-event-object). This objects allows you specify the loyalty card to which the custom event should be attributed to.
   */
  loyalty?: {
    code?: string
  }
  /**
   * The metadata object stores all custom attributes assigned to the [custom event](https://docs.voucherify.io/reference/custom-event-object). A set of key/value pairs that you can attach to an event object. It can be useful for storing additional information about the event in a structured format. Event metadata schema is defined in the Dashboard > Project Settings > Event Schema > Edit particular event > Metadata property definition.
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * The name of the event that will be saved as a [custom event](https://docs.voucherify.io/reference/the-custom-event-object) in Voucherify.
   */
  event?: string
  /**
   * Type of the [event](https://segment.com/docs/connections/spec/). It can be Track, Page or Screen.
   */
  type: string
}
