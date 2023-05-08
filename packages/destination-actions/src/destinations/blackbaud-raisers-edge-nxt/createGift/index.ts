import { ActionDefinition, ExecuteInput, InputField, IntegrationError, RequestFn } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { perform as performCreateOrUpdateIndividualConstituent } from '../createOrUpdateIndividualConstituent'
import { BlackbaudSkyApi } from '../api'
import { Gift, StringIndexedObject } from '../types'
import {
  augmentFieldsWithConstituentFields,
  buildConstituentPayloadFromPayload,
  buildGiftDataFromPayload
} from '../utils'

const fields: Record<string, InputField> = augmentFieldsWithConstituentFields({
  acknowledgement: {
    label: 'Acknowledgement',
    description: 'The gift acknowledgement.',
    type: 'object',
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    properties: {
      date: {
        label: 'Date',
        type: 'datetime',
        description: 'The date associated with the acknowledgement in ISO-8601 format.'
      },
      status: {
        label: 'Status',
        type: 'string',
        description:
          'The status of the acknowledgement. Available values are: ACKNOWLEDGED, NEEDSACKNOWLEDGEMENT, and DONOTACKNOWLEDGE.'
      }
    },
    default: {
      date: {
        '@path': '$.properties.acknowledgement.date'
      },
      status: {
        '@path': '$.properties.acknowledgement.status'
      }
    }
  },
  amount: {
    label: 'Gift Amount',
    description: 'The monetary amount of the gift in number format, e.g. 12.34',
    type: 'number',
    required: true,
    default: {
      '@path': '$.properties.revenue'
    }
  },
  batch_number: {
    label: 'Batch Number',
    description: 'The batch number of the gift up to 50 characters (including the batch prefix).',
    type: 'string',
    default: {
      '@path': '$.properties.batchNumber'
    }
  },
  batch_prefix: {
    label: 'Batch Prefix',
    description:
      'The batch prefix of the gift. If provided, must include at least one letter. Required when Batch Number has a value, and defaults to "API" if no value is provided.',
    type: 'string',
    default: {
      '@path': '$.properties.batchPrefix'
    }
  },
  check_date: {
    label: 'Check Date',
    description: 'The check date in ISO-8601 format.',
    type: 'datetime',
    default: {
      '@path': '$.properties.checkDate'
    }
  },
  check_number: {
    label: 'Check Number',
    description: 'The check number in string format, e.g. "12345"',
    type: 'string',
    default: {
      '@path': '$.properties.checkNumber'
    }
  },
  constituency: {
    label: 'Constituency',
    description:
      'The constituency value of the gift. If no value is provided, the default constituency of the donor will be used.',
    type: 'string',
    default: {
      '@path': '$.properties.constituency'
    }
  },
  date: {
    label: 'Gift Date',
    description: 'The gift date in ISO-8601 format.',
    type: 'datetime'
  },
  default_fundraiser_credits: {
    label: 'Default Fundraiser Credits',
    description: 'Indicates whether to use default fundraiser credits.',
    type: 'boolean',
    default: {
      '@path': '$.properties.defaultFundraiserCredits'
    }
  },
  default_soft_credits: {
    label: 'Default Soft Credits',
    description: 'Indicates whether to use default soft credits.',
    type: 'boolean',
    default: {
      '@path': '$.properties.defaultSoftCredits'
    }
  },
  fund_id: {
    label: 'Fund ID',
    description: 'The ID of the fund associated with the gift.',
    type: 'string',
    required: true,
    default: {
      '@path': '$.properties.fundId'
    }
  },
  gift_code: {
    label: 'Gift Code',
    description: 'The gift code. Available values are the entries in the Gift Code table.',
    type: 'string',
    default: {
      '@path': '$.properties.giftCode'
    }
  },
  gift_status: {
    label: 'Gift Status',
    description:
      'The status of the gift. Available values are "Active", "Held", "Terminated", "Completed", and "Cancelled".',
    type: 'string',
    choices: [
      { label: 'Active', value: 'Active' },
      { label: 'Held', value: 'Held' },
      { label: 'Terminated', value: 'Terminated' },
      { label: 'Completed', value: 'Completed' },
      { label: 'Cancelled', value: 'Cancelled' }
    ],
    default: {
      '@path': '$.properties.giftStatus'
    }
  },
  is_anonymous: {
    label: 'Is Anonymous',
    description: 'Indicates whether the gift is anonymous.',
    type: 'boolean',
    default: {
      '@path': '$.properties.isAnonymous'
    }
  },
  linked_gifts: {
    label: 'Linked Gifts',
    description:
      'The recurring gift associated with the payment being added. When adding a recurring gift payment, a linked_gifts field must be included as an array of strings with the ID of the recurring gift to which the payment is linked.',
    type: 'string',
    multiple: true
  },
  lookup_id: {
    label: 'Lookup ID',
    description: 'The organization-defined identifier for the gift.',
    type: 'string'
  },
  payment_method: {
    label: 'Payment Method',
    description:
      'The payment method. Available values are "Cash", "CreditCard", "PersonalCheck", "DirectDebit", "Other", "PayPal", or "Venmo".',
    type: 'string',
    required: true,
    choices: [
      { label: 'Cash', value: 'Cash' },
      { label: 'Credit Card', value: 'CreditCard' },
      { label: 'Personal Check', value: 'PersonalCheck' },
      { label: 'Direct Debit', value: 'DirectDebit' },
      { label: 'Other', value: 'Other' },
      { label: 'PayPal', value: 'PayPal' },
      { label: 'Venmo', value: 'Venmo' }
    ],
    default: {
      '@path': '$.properties.paymentMethod'
    }
  },
  post_date: {
    label: 'Post Date',
    description: 'The date that the gift was posted to general ledger in ISO-8601 format.',
    type: 'datetime',
    default: {
      '@path': '$.properties.postDate'
    }
  },
  post_status: {
    label: 'Post Status',
    description:
      'The general ledger post status of the gift. Available values are "Posted", "NotPosted", and "DoNotPost".',
    type: 'string',
    choices: [
      { label: 'Posted', value: 'Posted' },
      { label: 'Not Posted', value: 'NotPosted' },
      { label: 'Do Not Post', value: 'DoNotPost' }
    ],
    default: 'NotPosted'
  },
  receipt: {
    label: 'Receipt',
    description: 'The gift receipt.',
    type: 'object',
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    properties: {
      date: {
        label: 'Date',
        type: 'datetime',
        description:
          'The date that the gift was receipted. Includes an offset from UTC in ISO-8601 format: 1969-11-21T10:29:43.'
      },
      status: {
        label: 'Status',
        type: 'string',
        description: 'The receipt status of the gift. Available values are RECEIPTED, NEEDSRECEIPT, and DONOTRECEIPT.'
      }
    },
    default: {
      date: {
        '@path': '$.properties.receipt.date'
      },
      status: {
        '@path': '$.properties.receipt.status'
      }
    }
  },
  recurring_gift_schedule: {
    label: 'Recurring Gift Schedule',
    description: 'The recurring gift schedule. When adding a recurring gift, a schedule is required.',
    type: 'object',
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    properties: {
      end_date: {
        label: 'End Date',
        type: 'datetime',
        description: 'Date the recurring gift should end in ISO-8601 format.'
      },
      frequency: {
        label: 'Frequency',
        type: 'string',
        description:
          'Installment frequency of the recurring gift to add. Available values are WEEKLY, EVERY_TWO_WEEKS, EVERY_FOUR_WEEKS, MONTHLY, QUARTERLY, ANNUALLY.'
      },
      start_date: {
        label: 'Start Date',
        type: 'datetime',
        description: 'Date the recurring gift should start in ISO-8601 format.'
      }
    },
    default: {
      end_date: {
        '@path': '$.properties.recurring_gift_schedule.end_date'
      },
      frequency: {
        '@path': '$.properties.recurring_gift_schedule.frequency'
      },
      start_date: {
        '@path': '$.properties.recurring_gift_schedule.start_date'
      }
    }
  },
  reference: {
    label: 'Reference',
    description:
      'Notes to track special details about a gift such as the motivation behind it or a detailed description of a gift-in-kind. Limited to 255 characters.',
    type: 'string',
    default: {
      '@path': '$.properties.reference'
    }
  },
  subtype: {
    label: 'Subtype',
    description: 'The subtype of the gift.',
    type: 'string',
    default: {
      '@path': '$.properties.subtype'
    }
  },
  type: {
    label: 'Type',
    description:
      'The gift type. Available values are "Donation", "Other", "GiftInKind", "RecurringGift", and "RecurringGiftPayment".',
    type: 'string',
    choices: [
      { label: 'Donation', value: 'Donation' },
      { label: 'Other', value: 'Other' },
      { label: 'GiftInKind', value: 'GiftInKind' },
      { label: 'RecurringGift', value: 'RecurringGift' },
      { label: 'RecurringGiftPayment', value: 'RecurringGiftPayment' }
    ],
    default: 'Donation'
  }
})

const perform: RequestFn<Settings, Payload> = async (request, { settings, payload }) => {
  const constituentPayload = buildConstituentPayloadFromPayload(payload as StringIndexedObject)

  let constituentId = payload.constituent_id
  if (Object.keys(constituentPayload).length > 0) {
    const createOrUpdateIndividualConstituentResponse = await performCreateOrUpdateIndividualConstituent(request, {
      settings: settings,
      payload: constituentPayload
    } as ExecuteInput<Settings, Payload>)
    constituentId = createOrUpdateIndividualConstituentResponse.id
  } else if (constituentId === undefined) {
    throw new IntegrationError('Missing constituent_id value', 'MISSING_REQUIRED_FIELD', 400)
  }

  const blackbaudSkyApiClient: BlackbaudSkyApi = new BlackbaudSkyApi(request)

  const giftData = buildGiftDataFromPayload(constituentId as string, payload) as Gift

  return blackbaudSkyApiClient.createGift(giftData)
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Gift',
  description: "Create a Gift record in Raiser's Edge NXT.",
  defaultSubscription: 'type = "track" and event = "Donation Completed"',
  fields,
  perform
}

export default action
