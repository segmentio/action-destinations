import { HTTPError, MisconfiguredFieldError } from '@segment/actions-core'

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

export const MissingUserOrAnonymousIdThrowableError = new MisconfiguredFieldError(
  'Either `Anonymous ID` or `User ID` must be defined.'
)

export const InvalidEndpointSelectedThrowableError = new MisconfiguredFieldError(
  'A valid endpoint must be selected. Please check your Segment settings.'
)
