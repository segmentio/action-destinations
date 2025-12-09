const REVENUE_KEYS = ['revenue', 'price', 'productId', 'quantity', 'revenueType']
const USER_PROPERTY_KEYS = ['utm_properties', 'referrer', 'setOnce', 'setAlways','add','autocaptureAttributionEnabled','autocaptureAttributionSet','autocaptureAttributionSetOnce','autocaptureAttributionUnset']
export const KEYS_TO_OMIT = [...REVENUE_KEYS, ...USER_PROPERTY_KEYS, 'trackRevenuePerProduct']
export const DESTINATION_INTEGRATION_NAME = 'Actions Amplitude'