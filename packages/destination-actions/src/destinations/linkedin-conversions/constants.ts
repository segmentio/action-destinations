import { DependsOnConditions } from '@segment/actions-core/destination-kit/types'

export const LINKEDIN_API_VERSION = '202401'
export const BASE_URL = 'https://api.linkedin.com/rest'
export const LINKEDIN_SOURCE_PLATFORM = 'SEGMENT'

interface Choice {
  value: string | number
  label: string
}

export const CONVERSION_TYPE_OPTIONS: Choice[] = [
  { label: 'Add to Cart', value: 'ADD_TO_CART' },
  { label: 'Download', value: 'DOWNLOAD' },
  { label: 'Install', value: 'INSTALL' },
  { label: 'Key Page View', value: 'KEY_PAGE_VIEW' },
  { label: 'Lead', value: 'LEAD' },
  { label: 'Purchase', value: 'PURCHASE' },
  { label: 'Sign Up', value: 'SIGN_UP' },
  { label: 'Other', value: 'OTHER' },
  { label: 'Talent Lead', value: 'TALENT_LEAD' },
  { label: 'Job Apply', value: 'JOB_APPLY' },
  { label: 'Save', value: 'SAVE' },
  { label: 'Start Checkout', value: 'START_CHECKOUT' },
  { label: 'Schedule', value: 'SCHEDULE' },
  { label: 'View Content', value: 'VIEW_CONTENT' },
  { label: 'View Video', value: 'VIEW_VIDEO' },
  { label: 'Add Billing Info', value: 'ADD_BILLING_INFO' },
  { label: 'Book Appointment', value: 'BOOK_APPOINTMENT' },
  { label: 'Request Quote', value: 'REQUEST_QUOTE' },
  { label: 'Search', value: 'SEARCH' },
  { label: 'Subscribe', value: 'SUBSCRIBE' },
  { label: 'Ad Click', value: 'AD_CLICK' },
  { label: 'Ad View', value: 'AD_VIEW' },
  { label: 'Complete Signup', value: 'COMPLETE_SIGNUP' },
  { label: 'Submit Application', value: 'SUBMIT_APPLICATION' },
  { label: 'Phone Call', value: 'PHONE_CALL' },
  { label: 'Invite', value: 'INVITE' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Share', value: 'SHARE' },
  { label: 'Donate', value: 'DONATE' },
  { label: 'Add to List', value: 'ADD_TO_LIST' },
  { label: 'Rate', value: 'RATE' },
  { label: 'Start Trial', value: 'START_TRIAL' },
  { label: 'Outbound Click', value: 'OUTBOUND_CLICK' },
  { label: 'Contact', value: 'CONTACT' },
  { label: 'Marketing Qualified Lead', value: 'MARKETING_QUALIFIED_LEAD' },
  { label: 'Sales Qualified Lead', value: 'SALES_QUALIFIED_LEAD' }
]

export const SUPPORTED_LOOKBACK_WINDOW_CHOICES: Choice[] = [
  { label: '1 day', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 }
]

export const DEFAULT_POST_CLICK_LOOKBACK_WINDOW = 30
export const DEFAULT_VIEW_THROUGH_LOOKBACK_WINDOW = 7

export const DEPENDS_ON_CONVERSION_RULE_ID: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'conversionRuleId',
      operator: 'is_not',
      value: undefined
    }
  ]
}
