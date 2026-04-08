export const GOOGLE_API_VERSION = 'v2'
export const BASE_URL = `https://audiencepartner.googleapis.com/${GOOGLE_API_VERSION}/products/productName/customers/advertiserID/`
export const CREATE_AUDIENCE_URL = `${BASE_URL}userLists:mutate`
export const GET_AUDIENCE_URL = `${BASE_URL}audiencePartner:searchStream`
export const OAUTH_URL = 'https://www.googleapis.com/oauth2/v4/token'
export const SEGMENT_DATA_PARTNER_ID = '8152223833'
export const PRODUCT_LINK_SEARCH_URL = `SELECT product_link.productLower.productLower_customer FROM product_link WHERE product_link.
          productLower.productLower_customer = 'products/productUpper/customers/advertiserID'`
