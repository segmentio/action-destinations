// GEC's max batch size is 2000
// https://developers.google.com/google-ads/api/docs/best-practices/quotas#conversion_upload_service
export const GOOGLE_ENHANCED_CONVERSIONS_BATCH_SIZE = 1500

export const STATUS_CODE_MAPPING = {
  0: {
    status: 200
  },
  1: {
    status: 499
  },
  2: {
    status: 500
  },
  3: {
    status: 400
  },
  4: {
    status: 504
  },
  5: {
    status: 404
  },
  6: {
    status: 409
  },
  7: {
    status: 403
  },
  8: {
    status: 429
  },
  9: {
    status: 400
  },
  10: {
    status: 409
  },
  11: {
    status: 400
  },
  12: {
    status: 501
  },
  13: {
    status: 500
  },
  14: {
    status: 503
  },
  15: {
    status: 500
  },
  16: {
    status: 401
  }
}
