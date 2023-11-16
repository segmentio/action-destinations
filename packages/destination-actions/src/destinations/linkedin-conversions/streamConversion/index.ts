import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { LinkedInConversions } from '../api'
import { SUPPORTED_ID_TYPE } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Stream Conversion Event',
  description: 'Directly streams conversion events to a specific conversion rule.',
  defaultSubscription: 'type = "track"',
  fields: {
    adAccountId: {
      label: 'Ad Account',
      description: 'A dynamic field dropdown which fetches all adAccounts.',
      type: 'string',
      required: true,
      dynamic: true
    },
    conversionId: {
      label: 'Conversion Rule',
      description: 'Fetches a list of conversion rules given an ad account id.',
      type: 'string',
      required: false,
      dynamic: true
    },
    conversionHappenedAt: {
      label: 'Timestamp',
      description:
        'Epoch timestamp in milliseconds at which the conversion event happened. If your source records conversion timestamps in second, insert 000 at the end to transform it to milliseconds.',
      type: 'integer',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    conversionValue: {
      label: 'Conversion Value',
      description: 'The monetary value for this conversion. Example: {“currencyCode”: “USD”, “amount”: “50.0”}.',
      type: 'object',
      required: false,
      properties: {
        currencyCode: {
          label: 'Currency Code',
          type: 'string',
          required: true,
          description: 'ISO format'
        },
        amount: {
          label: 'Amount',
          type: 'string',
          required: true,
          description: 'Value of the conversion in decimal string. Can be dynamically set up or have a fixed value.'
        }
      }
    },
    eventId: {
      label: 'Event ID',
      description: 'Will be used for deduplication in future.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.messageId'
      }
    },
    user: {
      label: 'User',
      description: 'The user(s) to associate this conversion to. `userId` array or `userInfo` combination is required.',
      type: 'object',
      required: true,
      properties: {
        userIds: {
          label: 'User Ids',
          type: 'object',
          multiple: true,
          required: true,
          properties: {
            idType: {
              label: 'idType',
              type: 'string',
              required: true
            },
            idValue: {
              label: 'idValue',
              type: 'string',
              required: true
            }
          }
        },
        userInfo: {
          label: 'User Info',
          type: 'object',
          required: false,
          properties: {
            firstName: {
              label: 'First Name',
              type: 'string',
              required: false
            },
            lastName: {
              label: 'Last Name',
              type: 'string',
              required: false
            },
            companyName: {
              label: 'Company Name',
              type: 'string',
              required: false
            },
            title: {
              label: 'Title',
              type: 'string',
              required: false
            },
            countryCode: {
              label: 'Country Code',
              type: 'string',
              required: false
            }
          }
        }
      }
    },
    campaignId: {
      label: 'Campaign',
      type: 'string',
      required: true,
      dynamic: true,
      description: 'A dynamic field dropdown which fetches all active campaigns.'
    }
  },
  dynamicFields: {
    adAccountId: async (request) => {
      const linkedIn = new LinkedInConversions(request)
      return linkedIn.getAdAccounts()
    },
    conversionId: async (request, { payload }) => {
      const linkedIn = new LinkedInConversions(request)
      return linkedIn.getConversionRulesList(payload.adAccountId)
    },
    campaignId: async (request, { payload }) => {
      const linkedIn = new LinkedInConversions(request)
      return linkedIn.getCampaignsList(payload.adAccountId)
    }
  },
  perform: async (request, { payload }) => {
    validate(payload)

    const linkedinApiClient: LinkedInConversions = new LinkedInConversions(request)
    try {
      await linkedinApiClient.associateCampignToConversion(payload)
      return linkedinApiClient.streamConversionEvent(payload)
    } catch (error) {
      return error
    }
  }
}

function validate(payload: Payload) {
  const dateFromTimestamp = new Date(payload.conversionHappenedAt)
  if (isNaN(dateFromTimestamp.getTime())) {
    throw new PayloadValidationError('Timestamp field should be valid timestamp.')
  }

  // Check if the timestamp is within the past 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  if (payload.conversionHappenedAt < ninetyDaysAgo) {
    throw new PayloadValidationError('Timestamp should be within the past 90 days.')
  }

  if (
    payload.user.userIds.length === 0 &&
    (!payload.user.userInfo || !(payload.user.userInfo.firstName && payload.user.userInfo.lastName))
  ) {
    throw new PayloadValidationError('Either userIds array or userInfo with firstName and lastName should be present.')
  } else if (payload.user.userIds.length !== 0) {
    const isValidUserIds = payload.user.userIds.some((obj) => {
      return SUPPORTED_ID_TYPE.includes(obj.idType)
    })

    if (!isValidUserIds) {
      throw new PayloadValidationError('Invalid idType in userIds field.')
    }
  }
}

export default action
