import { defaultValues, Preset } from '@segment/actions-core'
import reportAppEvent from './reportAppEvent'

const productProperties = {
  price: {
    '@path': '$.price'
  },
  quantity: {
    '@path': '$.quantity'
  },
  content_category: {
    '@path': '$.category'
  },
  content_id: {
    '@path': '$.product_id'
  },
  content_name: {
    '@path': '$.name'
  },
  brand: {
    '@path': '$.brand'
  }
}

const singleProductContents = {
  ...defaultValues(reportAppEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties',
      {
        ...productProperties
      }
    ]
  }
}

const multiProductContents = {
  ...defaultValues(reportAppEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties.products',
      {
        ...productProperties
      }
    ]
  }
}

const PRODUCT_MAPPING_TYPE = {
    MULTIPLE: 'MULTIPLE',
    SINGLE: 'SINGLE',
    NONE: 'NONE'
}

const STANDARD_EVENTS = [
  ['ACHIEVE_LEVEL', 'AchieveLevel', 'Achieve a level', 'Level Achieved', PRODUCT_MAPPING_TYPE.NONE],
  ['ADD_PAYMENT_INFO', 'AddPaymentInfo', 'Add payment information', 'Payment Info Entered', PRODUCT_MAPPING_TYPE.NONE],
  ['ADD_TO_CART', 'AddToCart', 'Add to cart', 'Product Added', PRODUCT_MAPPING_TYPE.SINGLE],
  ['ADD_TO_WISHLIST', 'AddToWishlist', 'Add to wishlist', 'Product Added to Wishlist', PRODUCT_MAPPING_TYPE.SINGLE],
  ['CHECKOUT', 'Checkout', 'Place an order', 'Checkout Started', PRODUCT_MAPPING_TYPE.MULTIPLE],
  ['COMPLETE_TUTORIAL', 'CompleteTutorial', 'Complete the tutorial', 'Tutorial Completed', PRODUCT_MAPPING_TYPE.NONE],
  ['CREATE_GROUP', 'CreateGroup', 'Create a group', 'Group Created', PRODUCT_MAPPING_TYPE.NONE],
  ['CREATE_ROLE', 'CreateRole', 'Create a role', 'Role Created', PRODUCT_MAPPING_TYPE.NONE],
  ['GENERATE_LEAD', 'GenerateLead', 'Generate a lead', 'Lead Generated', PRODUCT_MAPPING_TYPE.NONE],
  ['IN_APP_AD_CLICK', 'InAppADClick', 'In-app ad click', 'Application Ad Clicked', PRODUCT_MAPPING_TYPE.NONE],
  ['IN_APP_AD_IMPR', 'InAppADImpr', 'In-app ad impression', 'Application Ad Served', PRODUCT_MAPPING_TYPE.NONE],
  ['INSTALL_APP', 'InstallApp', 'Install the app', 'Application Installed', PRODUCT_MAPPING_TYPE.NONE],
  ['JOIN_GROUP', 'JoinGroup', 'Join a group', 'Group Joined', PRODUCT_MAPPING_TYPE.NONE],
  ['LAUNCH_APP', 'LaunchAPP', 'Launch the app', 'Application Opened', PRODUCT_MAPPING_TYPE.NONE],
  ['LOAN_APPLICATION', 'LoanApplication', 'Apply for a loan', 'Loan Application Submitted', PRODUCT_MAPPING_TYPE.NONE],
  ['LOAN_APPROVAL', 'LoanApproval', 'Loan is approved', 'Loan Approved', PRODUCT_MAPPING_TYPE.NONE],
  ['LOAN_DISBURSAL', 'LoanDisbursal', 'Loan is disbursed', 'Loan Disbursed', PRODUCT_MAPPING_TYPE.NONE],
  ['LOGIN', 'Login', 'Log in successfully', 'Signed In', PRODUCT_MAPPING_TYPE.NONE],
  ['PURCHASE', 'Purchase', 'Complete payment', 'Order Completed', PRODUCT_MAPPING_TYPE.MULTIPLE],
  ['RATE', 'Rate', 'Rate', 'Rating Completed', PRODUCT_MAPPING_TYPE.NONE],
  ['REGISTRATION', 'Registration', 'Complete the registration', 'Signed Up', PRODUCT_MAPPING_TYPE.NONE],
  ['SEARCH', 'Search', 'Search', 'Products Searched', PRODUCT_MAPPING_TYPE.NONE],
  ['SPEND_CREDITS', 'SpendCredits', 'Spend credits', 'Credits Spent', PRODUCT_MAPPING_TYPE.NONE],
  ['START_TRIAL', 'StartTrial', 'Start the trial', 'Trial Started', PRODUCT_MAPPING_TYPE.NONE],
  ['SUBSCRIBE', 'Subscribe', 'Subscribe', 'User Subscribed', PRODUCT_MAPPING_TYPE.NONE],
  ['UNLOCK_ACHIEVEMENT', 'UnlockAchievement', 'Unlock an achievement', 'Achievement Unlocked', PRODUCT_MAPPING_TYPE.NONE],
  ['VIEW_CONTENT', 'ViewContent', 'View details', 'Product Viewed', PRODUCT_MAPPING_TYPE.SINGLE],
] as const

export const presets: Preset[] = STANDARD_EVENTS.map(
  ([, fieldValue, description, segmentEventName, productMappingType]) => ({
    type: 'automatic',
    partnerAction: 'reportAppEvent',
    name: description,
    subscribe: `event = "${segmentEventName}"`,
    mapping: {
      ...defaultValues(reportAppEvent.fields),
      event: fieldValue,
      ...(productMappingType === PRODUCT_MAPPING_TYPE.SINGLE
      ? singleProductContents
      : productMappingType === PRODUCT_MAPPING_TYPE.MULTIPLE
      ? multiProductContents
      : {})
    }
  })
)

export const APP_STANDARD_EVENT_NAMES = Object.fromEntries(
  STANDARD_EVENTS.map(([constantKey, standardEventName, ,]) => [constantKey, standardEventName])
)
