import { HTTPError, PayloadValidationError } from '@segment/actions-core'

export class SegmentPublicAPIError extends HTTPError {
  response: Response & {
    errors: {
      type: string
      message?: string
      field?: string
      data?: string
      status?: number
    }
  }
}

export const MissingUserOrAnonymousIdThrowableError = new PayloadValidationError(
  'Either `Anonymous ID` or `User ID` must be defined.'
)

export const InvalidEndpointSelectedThrowableError = new PayloadValidationError(
  'A valid endpoint must be selected. Please check your Segment settings.'
)

export const MissingExternalIdsError = new PayloadValidationError(
  'Either `Email` or `Phone` or `Android_Push_Token` or `Ios_Push_Token` must be defined.'
)

export const MissingEmailIfEmailSubscriptionIsPresentError = new PayloadValidationError(
  'A valid `Email` must be defined for `Email_Subscription`.'
)

export const MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentError = new PayloadValidationError(
  'A valid `Phone` must be defined for `Sms_Subscription` or `Whatsapp_Subscription`.'
)

export const MissingSubscriptionStatusesError = new PayloadValidationError(
  'If any of `Email`, `Phone`, `Android_Push_Token` or `Ios_Push_Token` is present, `Email_Subscription` or `Sms_Subscription` or `Whatsapp_Subscription` or `Ios_Push_Subscription` or `Android_Push_Subscription` must be defined.'
)

export const MissingEmailSubscriptionIfSubscriptionGroupsIsPresentError = new PayloadValidationError(
  '`Email_Subscription` must be defined if Subscription Groups are present.'
)

export const InvalidSubscriptionStatusError = new PayloadValidationError(
  'Invalid Subscription Status in `Email_Subscription` or `Sms_Subscription` or `Whatsapp_Subscription` or `Android_Push_Subscription` or `Ios_Push_Subscription`.'
)

export const InvalidGroupSubscriptionStatusError = new PayloadValidationError(
  'Invalid Subscription Status for subscription groups.'
)

export const MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentError = new PayloadValidationError(
  'A valid `Android_Push_Token` must be defined for `Android_Push_Subscription`.'
)

export const MissingIosPushTokenIfIosPushSubscriptionIsPresentError = new PayloadValidationError(
  'A valid `Ios_Push_Token` must be defined for `Ios_Push_Subscription`.'
)

export const InvalidSubsriptionStatusError = new PayloadValidationError('Invalid Subscription Status.')
