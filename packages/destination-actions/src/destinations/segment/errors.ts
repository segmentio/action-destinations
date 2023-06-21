import { PayloadValidationError } from '@segment/actions-core'

export const MissingUserOrAnonymousIdThrowableError = new PayloadValidationError(
  'Either `Anonymous ID` or `User ID` must be defined.'
)

export const InvalidEndpointSelectedThrowableError = new PayloadValidationError(
  'A valid endpoint must be selected. Please check your Segment settings.'
)
