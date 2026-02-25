import { 
    AMPLITUDE_API_USER_SEARCH_VERSION, 
    AMPLITUDE_API_COHORTS_UPLOAD_VERSION, 
    AMPLITUDE_API_COHORTS_GET_ONE_VERSION,
    AMPLITUDE_API_COHORTS_UPDATE_MEMBERSHIP_VERSION
} from './versioning-info'

export const ID_TYPES = {
    BY_USER_ID: 'BY_USER_ID',
    BY_AMP_ID: 'BY_AMP_ID'
}

export const OPERATIONS = {
    ADD: 'ADD',
    REMOVE: 'REMOVE'
}

export const endpoints = {
  usersearch: {
    north_america: `https://amplitude.com/api/${AMPLITUDE_API_USER_SEARCH_VERSION}/usersearch`,
    europe: `https://analytics.eu.amplitude.com/api/${AMPLITUDE_API_USER_SEARCH_VERSION}/usersearch`
  }, 
  cohorts_upload: {
    north_america: `https://amplitude.com/api/${AMPLITUDE_API_COHORTS_UPLOAD_VERSION}/cohorts/upload`,
    europe: `https://analytics.eu.amplitude.com/api/${AMPLITUDE_API_COHORTS_UPLOAD_VERSION}/cohorts/upload`
  },
  cohorts_get_one: {
    north_america: `https://amplitude.com/api/${AMPLITUDE_API_COHORTS_GET_ONE_VERSION}/cohorts/request`,
    europe: `https://analytics.eu.amplitude.com/api/${AMPLITUDE_API_COHORTS_GET_ONE_VERSION}/cohorts/request`
  },
  cohorts_membership: {
    north_america: `https://amplitude.com/api/${AMPLITUDE_API_COHORTS_UPDATE_MEMBERSHIP_VERSION}/cohorts/membership`,
    europe: `https://analytics.eu.amplitude.com/api/${AMPLITUDE_API_COHORTS_UPDATE_MEMBERSHIP_VERSION}/cohorts/membership`
  }
}