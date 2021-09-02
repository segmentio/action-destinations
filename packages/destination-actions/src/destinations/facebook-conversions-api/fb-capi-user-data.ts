import { InputField } from '@segment/actions-core/src/destination-kit/types'
import hash from '../../lib/hash'

// Implementation of Facebook user data object
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters

export const user_data_field: InputField = {
  label: 'User Data',
  description: 'User Data',
  type: 'object',
  properties: {
    email: {
      label: 'Email',
      description: 'User Email',
      type: 'string'
    },
    phone: {
      label: 'Phone',
      description: 'User phone number',
      type: 'string'
    },
    gender: {
      label: 'Gender',
      description: 'User gender',
      type: 'string'
    },
    dateOfBirth: {
      label: 'Date of Birth',
      description: 'Date of Birth',
      type: 'string'
    },
    lastName: {
      label: 'Last Name',
      description: 'Last Name',
      type: 'string'
    },
    firstName: {
      label: 'First Name',
      description: 'First Name',
      type: 'string'
    },
    city: {
      label: 'City',
      description: 'City',
      type: 'string'
    },
    state: {
      label: 'State',
      description: 'State',
      type: 'string'
    },
    zip: {
      label: 'Zip Code',
      description: 'Zip Code',
      type: 'string'
    },
    country: {
      label: 'Country',
      description: 'Country',
      type: 'string'
    },
    externalId: {
      label: 'External ID',
      description: 'External ID',
      type: 'string'
    },
    client_ip_address: {
      label: 'Client IP Address',
      description: 'Client IP Address',
      type: 'string'
    },
    client_user_agent: {
      label: 'Client User Agent',
      description: 'Client User Agent',
      type: 'string'
    },
    clickID: {
      label: 'Click ID',
      description: 'Click ID',
      type: 'string'
    },
    browserID: {
      label: 'Browser ID',
      description: 'Browser ID',
      type: 'string'
    },
    subscriptionID: {
      label: 'Subscription ID',
      description: 'Subscription ID',
      type: 'string'
    },
    leadID: {
      label: 'Lead ID',
      description: 'Lead ID',
      type: 'string'
    },
    fbLoginID: {
      label: 'Facebook Login ID',
      description: 'Facebook Login ID',
      type: 'string'
    }
  }
}

interface UserData {
  /**
   * User Email
   */
  email?: string
  /**
   * User phone number
   */
  phone?: string
  /**
   * User gender
   */
  gender?: string
  /**
   * Date of Birth
   */
  dateOfBirth?: string
  /**
   * Last Name
   */
  lastName?: string
  /**
   * First Name
   */
  firstName?: string
  /**
   * City
   */
  city?: string
  /**
   * State
   */
  state?: string
  /**
   * Zip Code
   */
  zip?: string
  /**
   * Country
   */
  country?: string
  /**
   * External ID
   */
  externalId?: string
  /**
   * Client IP Address
   */
  client_ip_address?: string
  /**
   * Client User Agent
   */
  client_user_agent?: string
  /**
   * Click ID
   */
  clickID?: string
  /**
   * Browser ID
   */
  browserID?: string
  /**
   * Subscription ID
   */
  subscriptionID?: string
  /**
   * Lead ID
   */
  leadID?: string
  /**
   * Facebook Login ID
   */
  fbLoginID?: string
}

export const hash_user_data = (user_data: UserData): Object => {
  return {
    em: hash(user_data.email),
    ph: hash(user_data.phone),
    ge: hash(user_data.gender),
    db: hash(user_data.dateOfBirth),
    ln: hash(user_data.lastName),
    fn: hash(user_data.firstName),
    ct: hash(user_data.city),
    st: hash(user_data.state),
    zp: hash(user_data.zip),
    country: hash(user_data.country),
    external_id: hash(user_data.externalId), // Hashing this is recommended but not required.
    client_ip_address: user_data.client_ip_address,
    client_user_agent: user_data.client_user_agent,
    fbc: user_data.clickID,
    fbp: user_data.browserID,
    subscription_id: user_data.subscriptionID,
    lead_id: user_data.leadID,
    fb_login_id: user_data.fbLoginID
  }
}
