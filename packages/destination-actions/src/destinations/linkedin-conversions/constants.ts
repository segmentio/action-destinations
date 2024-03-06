export const LINKEDIN_API_VERSION = '202401'
export const BASE_URL = 'https://api.linkedin.com/rest'
export const LINKEDIN_SOURCE_PLATFORM = 'SEGMENT'

export const SUPPORTED_ID_TYPE = [
  'SHA256_EMAIL',
  'LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID',
  'ACXIOM_ID',
  'ORACLE_MOAT_ID'
]

interface Choice {
  value: string
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
