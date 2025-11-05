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

export const presets: Preset[] = [
    {
        name: 'Achieve a level',
        subscribe: 'event = "Level Achieved"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'AchieveLevel'
        },
        type: 'automatic'
    },
    {
        name: 'Add Payment Info',
        subscribe: 'event = "Payment Info Entered"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...multiProductContents,
        event: 'AddPaymentInfo'
        },
        type: 'automatic'
    },
    {
        name: 'Add to Cart',
        subscribe: 'event = "Product Added"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...singleProductContents,
        event: 'AddToCart'
        },
        type: 'automatic'
    },
    {
        name: 'Add to Wishlist',
        subscribe: 'event = "Product Added to Wishlist"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...singleProductContents,
        event: 'AddToWishlist'
        },
        type: 'automatic'
    },
    {
        name: 'Place an Order',
        subscribe: 'event = "Order Placed"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...multiProductContents,
        event: 'Checkout'
        },
        type: 'automatic'
    },
    {
        name: 'Complete a tutorial',
        subscribe: 'event = "Tutorial Completed"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'CompleteTutorial'
        },
        type: 'automatic'
    },
    {
        name: 'Create a group',
        subscribe: 'event = "Group Created"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'CreateGroup'
        },
        type: 'automatic'
    }, 
    {
        name: 'Create a group',
        subscribe: 'event = "Group Created"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'CreateGroup'
        },
        type: 'automatic'
    }, 
        {
        name: 'Create a group',
        subscribe: 'event = "Group Created"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'CreateGroup'
        },
        type: 'automatic'
    }, 
    {
        name: 'Create a role',
        subscribe: 'event = "Role Created"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'CreateRole'
        },
        type: 'automatic'
    },
    {
        name: 'Generate a lead',
        subscribe: 'event = "Lead Generated"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'GenerateLead'
        },
        type: 'automatic'
    },
    {
        name: 'In-app ad click',
        subscribe: 'event = "Application Ad Clicked"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'InAppADClick'
        },
        type: 'automatic'
    },
    {
        name: 'In-app ad impression',
        subscribe: 'event = "Application Ad Served"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'InAppADImpr'
        },
        type: 'automatic'
    },
    {
        name: 'Install the app',
        subscribe: 'event = "Application Installed"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'InstallApp'
        },
        type: 'automatic'
    },
    {
        name: 'Join a group',
        subscribe: 'event = "Group Joined"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'JoinGroup'
        },
        type: 'automatic'
    },
    {
        name: 'Launch the app',
        subscribe: 'event = "Application Opened"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'LaunchAPP'
        },
        type: 'automatic'
    },
    {
        name: 'Apply for a loan',
        subscribe: 'event = "Loan Application Completed"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'LoanApplication'
        },
        type: 'automatic'
    },
    {
        name: 'Loan is approved',
        subscribe: 'event = "Loan Approved"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'LoanApproval'
        },
        type: 'automatic'
    },
    {
        name: 'Loan is disbursed',
        subscribe: 'event = "Loan Disbursed"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'LoanDisbursal'
        },
        type: 'automatic'
    },
    {
        name: 'Log in successfully',
        subscribe: 'event = "Signed In"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'Login'
        },
        type: 'automatic'
    },
    {
        name: 'Complete Payment',
        subscribe: 'event = "Order Completed"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...multiProductContents,
        event: 'Purchase'
        },
        type: 'automatic'
    },    
    {
        name: 'Rate',
        subscribe: 'event = "Rated"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...multiProductContents,
        event: 'Rate'
        },
        type: 'automatic'
    },
    {
        name: 'Complete the registration',
        subscribe: 'event = "Signed Up"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'Registration'
        },
        type: 'automatic'
    },
    {
        name: 'Search',
        subscribe: 'event = "Products Searched"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...singleProductContents,
        event: 'Search'
        },
        type: 'automatic'
    },
    {
        name: 'Spend credits',
        subscribe: 'event = "Credits Spent"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'SpendCredits'
        },
        type: 'automatic'
    },
    {
        name: 'Start the trial',
        subscribe: 'event = "Trial Started"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'StartTrial'
        },
        type: 'automatic'
    },
    {
        name: 'Subscribe',
        subscribe: 'event = "Subscription Created"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'Subscribe'
        },
        type: 'automatic'
    },
    {
        name: 'Unlock an achievement',
        subscribe: 'event = "Achievement Unlocked"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'UnlockAchievement'
        },
        type: 'automatic'
    },
    {
        name: 'View Content',
        subscribe: 'event = "Product Viewed"',
        partnerAction: 'reportAppEvent',
        mapping: {
        ...singleProductContents,
        event: 'ViewContent'
        },
        type: 'automatic'
    }
]