import { IntegrationError, RetryableError, HTTPError } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import { SEGMENT_UNIQUE_IDENTIFIER } from './properties'

export class HubSpotError extends HTTPError {
  response: Response & {
    data: {
      status: string
      message: string
      correlationId: string
      category: string
    }
  }
}
export const MissingIdentityCallThrowableError = new IntegrationError(
  'Identify (Upsert Contact) must be called before Group (Upsert Company) for the HubSpot Cloud (Actions) destination if ’Associate Contact with Company’ property is set to Yes (true).',
  'Missing Identity Call',
  400
)

export const CompanySearchThrowableError = new IntegrationError(
  'HubSpot returned 400 error while performing a company search. Please check if ’Company Search Fields’ contains valid properties defined in HubSpot.',
  'Company Search Failed',
  400
)

export const RestrictedPropertyThrowableError = new PayloadValidationError(
  `Segment uses ’${SEGMENT_UNIQUE_IDENTIFIER}’ property internally to map Segment Groups to HubSpot Companies. This property shouldn’t be defined explicitly.`
)

export const MultipleCompaniesInSearchResultThrowableError = new IntegrationError(
  `The search criteria defined by Company Search Fields returned more than one companies. The update request will be rejected.`,
  'Search Criteria Not Unique',
  400
)

export const SegmentUniqueIdentifierMissingRetryableError = new RetryableError(
  `The ’${SEGMENT_UNIQUE_IDENTIFIER}’ property doesn't exist in HubSpot. Segment will attempt to create the property and retry the action.`
)

export const CustomSearchThrowableError = new IntegrationError(
  'HubSpot returned 400 error while performing a custom object record search. Please check if Custom Object Record Search Fields’ contains valid properties defined in HubSpot.',
  'Custom Search Failed',
  400
)

export const MultipleCustomRecordsInSearchResultThrowableError = new IntegrationError(
  `The search criteria defined by Custom Object Record Search Fields returned more than one records. The update request will be rejected.`,
  'Search Criteria Not Unique',
  400
)

export function isSegmentUniqueIdentifierPropertyError(
  error: HubSpotError,
  segmentUniqueIdentifierProperty: string
): boolean {
  if (error?.response?.status !== 400) {
    return false
  }

  try {
    const errorMessage = error?.response?.data?.message?.replace('Property values were not valid: ', '')
    const errorList = JSON.parse(errorMessage)

    return (
      errorList.length === 1 &&
      errorList[0].name === segmentUniqueIdentifierProperty &&
      errorList[0].error === 'PROPERTY_DOESNT_EXIST'
    )
  } catch (e) {
    return false
  }
}
