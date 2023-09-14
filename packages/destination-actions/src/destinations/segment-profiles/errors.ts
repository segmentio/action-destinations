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

export const MissingEmailOrPhoneThrowableError = new PayloadValidationError(
  'Either `Email` or `Phone` must be defined.'
)

export const MissingEmailIfEmailSubscriptionIsPresentThrowableError = new PayloadValidationError(
  'A valid `Email` must be defined for `Email_Subscription`.'
)

export const MissingSmsOrWhatsappSubscriptionIfPhoneIsPresentThrowableError = new PayloadValidationError(
  'A valid `Sms_Subscription` or `Whatsapp_Subscription` must be defined, if `Phone` is present.'
)

export const MissingEmailSubscriptionIfEmailIsPresentThrowableError = new PayloadValidationError(
  'A valid `Email_Subscription` must be defined, if `Email` is present.'
)

export const MissingPhoneIfSmsOrWhatsappSubscriptionIsPresentThrowableError = new PayloadValidationError(
  'A valid `Phone` must be defined for `Sms_Subscription` or `Whatsapp_Subscription`.'
)

export const MissingEmailSmsOrWhatsappSubscriptionIfEmailPhoneIsPresentThrowableError = new PayloadValidationError(
  'If both Email and Phone is present, `Email_Subscription` or `Sms_Subscription` or `Whatsapp_Subscription` must be defined.'
)

export const MissingEmailSubscriptionIfSubscriptionGroupsIsPresentThrowableError = new PayloadValidationError(
  '`Email_Subscription` must be defined if Subscription Groups are present.'
)

export const InvalidSubscriptionStatusThrowableError = new PayloadValidationError(
  'Invalid Subscription Status in `Email_Subscription` or `Sms_Subscription` or `Whatsapp_Subscription` or `Android_Push_Subscription` or `Ios_Push_Subscription`.'
)

export const InvalidGroupSubscriptionStatusThrowableError = new PayloadValidationError(
  'Invalid Subscription Status for subscription groups.'
)

export const MissingAndroidPushTokenIfAndroidPushSubscriptionIsPresentThrowableError = new PayloadValidationError(
  'A valid `Android_Push_Token` must be defined for `Android_Push_Subscription`.'
)

export const MissingIosPushTokenIfIosPushSubscriptionIsPresentThrowableError = new PayloadValidationError(
  'A valid `Ios_Push_Token` must be defined for `Ios_Push_Subscription`.'
)

export const InvalidSubsriptionStatusThrowableError = new PayloadValidationError('Invalid Subscription Status.')
