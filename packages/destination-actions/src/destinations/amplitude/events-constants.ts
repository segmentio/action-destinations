const REVENUE_KETS = ['revenue', 'price', 'productId', 'quantity', 'revenueType']
const USER_PROPERTY_KEYS = ['utm_properties', 'referrer', 'setOnce', 'setAlways','add','autocaptureAttributionEnabled','autocaptureAttributionSet','autocaptureAttributionSetOnce','autocaptureAttributionUnset']
export const KEYS_TO_OMIT = [...REVENUE_KETS, ...USER_PROPERTY_KEYS, 'trackRevenuePerProduct']
export const DESTINATION_INTEGRATION_NAME = 'Actions Amplitude'