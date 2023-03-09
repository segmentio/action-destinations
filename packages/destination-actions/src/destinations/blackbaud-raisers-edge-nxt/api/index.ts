import { IntegrationError, ModifiedResponse, RequestClient, RetryableError } from '@segment/actions-core'
import { SKY_API_CONSTITUENT_URL, SKY_API_GIFTS_URL } from '../constants'
import {
  Address,
  Constituent,
  CreateConstituentResult,
  Email,
  ExistingAddress,
  ExistingConstituentResult,
  ExistingEmail,
  ExistingOnlinePresence,
  ExistingPhone,
  Gift,
  OnlinePresence,
  Phone,
  UpdateConstituentResult
} from '../types'
import { filterObjectListByMatchFields, isRequestErrorRetryable } from '../utils'

export class BlackbaudSkyApi {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async searchForConstituents(searchField: string, searchText: string): Promise<ModifiedResponse> {
    return this.request(
      `${SKY_API_CONSTITUENT_URL}/constituents/search?search_field=${searchField}&search_text=${searchText}`,
      {
        method: 'get'
      }
    )
  }

  async getExistingConstituent(emailData?: Partial<Email>, lookupId?: string): Promise<ExistingConstituentResult> {
    let constituentId = undefined

    // default to searching by email
    let searchField = 'email_address'
    let searchText = emailData?.address || ''

    if (lookupId) {
      // search by lookup_id if one is provided
      searchField = 'lookup_id'
      searchText = lookupId
    }

    const constituentSearchResponse = await this.searchForConstituents(searchField, searchText)
    const constituentSearchResults = await constituentSearchResponse.json()

    if (constituentSearchResults.count > 1) {
      // multiple existing constituents, throw an error
      throw new IntegrationError('Multiple records returned for given traits', 'MULTIPLE_EXISTING_RECORDS', 400)
    } else if (constituentSearchResults.count === 1) {
      // existing constituent
      constituentId = constituentSearchResults.value[0].id
    } else if (constituentSearchResults.count !== 0) {
      // if constituent count is not >= 0, something went wrong
      throw new IntegrationError('Unexpected constituent record count for given traits', 'UNEXPECTED_RECORD_COUNT', 500)
    }

    return Promise.resolve({
      id: constituentId
    })
  }

  async createConstituent(constituentData: Constituent): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents`, {
      method: 'post',
      json: constituentData
    })
  }

  async createConstituentWithRelatedObjects(
    constituentData: Constituent,
    addressData: Partial<Address>,
    emailData: Partial<Email>,
    onlinePresenceData: Partial<OnlinePresence>,
    phoneData: Partial<Phone>
  ): Promise<CreateConstituentResult> {
    // hardcode type
    constituentData.type = 'Individual'
    if (!constituentData.last) {
      // last name is required to create a new constituent
      // no last name, throw an error
      throw new IntegrationError('Missing last name value', 'MISSING_REQUIRED_FIELD', 400)
    }
    // request has last name
    // append other data objects to constituent
    if (Object.keys(addressData).length > 0) {
      constituentData.address = addressData as Address
    }
    if (Object.keys(emailData).length > 0) {
      constituentData.email = emailData as Email
    }
    if (Object.keys(onlinePresenceData).length > 0) {
      constituentData.online_presence = onlinePresenceData as OnlinePresence
    }
    if (Object.keys(phoneData).length > 0) {
      constituentData.phone = phoneData as Phone
    }

    // create constituent
    const createConstituentResponse = await this.createConstituent(constituentData)
    const constituentResult = await createConstituentResponse.json()

    return Promise.resolve({
      id: constituentResult.id
    })
  }

  async updateConstituent(constituentId: string, constituentData: Partial<Constituent>): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}`, {
      method: 'patch',
      json: constituentData,
      throwHttpErrors: false
    })
  }

  async getConstituentAddressList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/addresses?include_inactive=true`, {
      method: 'get',
      throwHttpErrors: false
    })
  }

  async createConstituentAddress(constituentId: string, addressData: Address): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/addresses`, {
      method: 'post',
      json: {
        ...addressData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentAddressById(addressId: string, addressData: Address): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/addresses/${addressId}`, {
      method: 'patch',
      json: {
        ...addressData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async getConstituentEmailList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(
      `${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/emailaddresses?include_inactive=true`,
      {
        method: 'get',
        throwHttpErrors: false
      }
    )
  }

  async createConstituentEmail(constituentId: string, emailData: Email): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/emailaddresses`, {
      method: 'post',
      json: {
        ...emailData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentEmailById(emailId: string, emailData: Email): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/emailaddresses/${emailId}`, {
      method: 'patch',
      json: {
        ...emailData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async getConstituentOnlinePresenceList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(
      `${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/onlinepresences?include_inactive=true`,
      {
        method: 'get',
        throwHttpErrors: false
      }
    )
  }

  async createConstituentOnlinePresence(
    constituentId: string,
    onlinePresenceData: OnlinePresence
  ): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/onlinepresences`, {
      method: 'post',
      json: {
        ...onlinePresenceData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentOnlinePresenceById(
    onlinePresenceId: string,
    onlinePresenceData: OnlinePresence
  ): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/onlinepresences/${onlinePresenceId}`, {
      method: 'patch',
      json: {
        ...onlinePresenceData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async getConstituentPhoneList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/phones?include_inactive=true`, {
      method: 'get',
      throwHttpErrors: false
    })
  }

  async createConstituentPhone(constituentId: string, phoneData: Phone): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/phones`, {
      method: 'post',
      json: {
        ...phoneData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentWithRelatedObjects(
    constituentId: string,
    constituentData: Partial<Constituent>,
    addressData: Partial<Address>,
    emailData: Partial<Email>,
    onlinePresenceData: Partial<OnlinePresence>,
    phoneData: Partial<Phone>
  ): Promise<UpdateConstituentResult> {
    // aggregate all errors
    const integrationErrors = []
    if (Object.keys(constituentData).length > 0) {
      // request has at least one constituent field to update
      // update constituent
      const updateConstituentResponse = await this.updateConstituent(constituentId, constituentData)
      if (updateConstituentResponse.status !== 200) {
        const statusCode = updateConstituentResponse.status
        const errorMessage = statusCode
          ? `${statusCode} error occurred when updating constituent`
          : 'Error occurred when updating constituent'
        if (isRequestErrorRetryable(statusCode)) {
          throw new RetryableError(errorMessage)
        } else {
          integrationErrors.push(errorMessage)
        }
      }
    }

    if (Object.keys(addressData).length > 0) {
      // request has address data
      // get existing addresses
      const getConstituentAddressListResponse = await this.getConstituentAddressList(constituentId)
      let updateAddressErrorCode = undefined
      if (getConstituentAddressListResponse.status !== 200) {
        updateAddressErrorCode = getConstituentAddressListResponse.status
      } else {
        const constituentAddressListResults = await getConstituentAddressListResponse.json()

        // check address list for one that matches request
        let existingAddress: ExistingAddress | undefined = undefined
        if (constituentAddressListResults.count > 0) {
          existingAddress = filterObjectListByMatchFields(constituentAddressListResults.value, addressData, [
            'address_lines',
            'city',
            'postal_code',
            'state'
          ]) as ExistingAddress | undefined
        }

        if (!existingAddress) {
          // new address
          // if this is the only address, make it primary
          if (addressData.primary !== false && constituentAddressListResults.count === 0) {
            addressData.primary = true
          }
          // create address
          const createConstituentAddressResponse = await this.createConstituentAddress(
            constituentId,
            addressData as Address
          )
          if (createConstituentAddressResponse.status !== 200) {
            updateAddressErrorCode = createConstituentAddressResponse.status
          }
        } else {
          // existing address
          if (
            existingAddress.inactive ||
            (addressData.do_not_mail !== undefined && addressData.do_not_mail !== existingAddress.do_not_mail) ||
            (addressData.primary !== undefined &&
              addressData.primary &&
              addressData.primary !== existingAddress.primary) ||
            addressData.type !== existingAddress.type
          ) {
            // request has at least one address field to update
            // update address
            const updateConstituentAddressByIdResponse = await this.updateConstituentAddressById(
              existingAddress.id,
              addressData as Address
            )
            if (updateConstituentAddressByIdResponse.status !== 200) {
              updateAddressErrorCode = updateConstituentAddressByIdResponse.status
            }
          }
        }
      }

      if (updateAddressErrorCode) {
        const errorMessage = updateAddressErrorCode
          ? `${updateAddressErrorCode} error occurred when updating constituent address`
          : 'Error occurred when updating constituent address'
        if (isRequestErrorRetryable(updateAddressErrorCode)) {
          throw new RetryableError(errorMessage)
        } else {
          integrationErrors.push(errorMessage)
        }
      }
    }

    if (Object.keys(emailData).length > 0) {
      // request has email data
      // get existing addresses
      const getConstituentEmailListResponse = await this.getConstituentEmailList(constituentId)
      let updateEmailErrorCode = undefined
      if (getConstituentEmailListResponse.status !== 200) {
        updateEmailErrorCode = getConstituentEmailListResponse.status
      } else {
        const constituentEmailListResults = await getConstituentEmailListResponse.json()

        // check email list for one that matches request
        let existingEmail: ExistingEmail | undefined = undefined
        if (constituentEmailListResults.count > 0) {
          existingEmail = filterObjectListByMatchFields(constituentEmailListResults.value, emailData, ['address']) as
            | ExistingEmail
            | undefined
        }

        if (!existingEmail) {
          // new email
          // if this is the only email, make it primary
          if (emailData.primary !== false && constituentEmailListResults.count === 0) {
            emailData.primary = true
          }
          // create email
          const createConstituentEmailResponse = await this.createConstituentEmail(constituentId, emailData as Email)
          if (createConstituentEmailResponse.status !== 200) {
            updateEmailErrorCode = createConstituentEmailResponse.status
          }
        } else {
          // existing email
          if (
            existingEmail.inactive ||
            (emailData.do_not_email !== undefined && emailData.do_not_email !== existingEmail.do_not_email) ||
            (emailData.primary !== undefined && emailData.primary && emailData.primary !== existingEmail.primary) ||
            emailData.type !== existingEmail.type
          ) {
            // request has at least one email field to update
            // update email
            const updateConstituentEmailByIdResponse = await this.updateConstituentEmailById(
              existingEmail.id,
              emailData as Email
            )
            if (updateConstituentEmailByIdResponse.status !== 200) {
              updateEmailErrorCode = updateConstituentEmailByIdResponse.status
            }
          }
        }
      }

      if (updateEmailErrorCode) {
        const errorMessage = updateEmailErrorCode
          ? `${updateEmailErrorCode} error occurred when updating constituent email`
          : 'Error occurred when updating constituent email'
        if (isRequestErrorRetryable(updateEmailErrorCode)) {
          throw new RetryableError(errorMessage)
        } else {
          integrationErrors.push(errorMessage)
        }
      }
    }

    if (Object.keys(onlinePresenceData).length > 0) {
      // request has online presence data
      // get existing online presences
      const getConstituentOnlinePresenceListResponse = await this.getConstituentOnlinePresenceList(constituentId)
      let updateOnlinePresenceErrorCode = undefined
      if (getConstituentOnlinePresenceListResponse.status !== 200) {
        updateOnlinePresenceErrorCode = getConstituentOnlinePresenceListResponse.status
      } else {
        const constituentOnlinePresenceListResults = await getConstituentOnlinePresenceListResponse.json()

        // check online presence list for one that matches request
        let existingOnlinePresence: ExistingOnlinePresence | undefined = undefined
        if (constituentOnlinePresenceListResults.count > 0) {
          existingOnlinePresence = filterObjectListByMatchFields(
            constituentOnlinePresenceListResults.value,
            onlinePresenceData,
            ['address']
          ) as ExistingOnlinePresence | undefined
        }

        if (!existingOnlinePresence) {
          // new online presence
          // if this is the only online presence, make it primary
          if (onlinePresenceData.primary !== false && constituentOnlinePresenceListResults.count === 0) {
            onlinePresenceData.primary = true
          }
          // create online presence
          const createConstituentOnlinePresenceResponse = await this.createConstituentOnlinePresence(
            constituentId,
            onlinePresenceData as OnlinePresence
          )
          if (createConstituentOnlinePresenceResponse.status !== 200) {
            updateOnlinePresenceErrorCode = createConstituentOnlinePresenceResponse.status
          }
        } else {
          // existing online presence
          if (
            existingOnlinePresence.inactive ||
            (onlinePresenceData.primary !== undefined &&
              onlinePresenceData.primary !== existingOnlinePresence.primary) ||
            onlinePresenceData.type !== existingOnlinePresence.type
          ) {
            // request has at least one online presence field to update
            // update online presence
            const updateConstituentOnlinePresenceByIdResponse = await this.updateConstituentOnlinePresenceById(
              existingOnlinePresence.id,
              onlinePresenceData as OnlinePresence
            )
            if (updateConstituentOnlinePresenceByIdResponse.status !== 200) {
              updateOnlinePresenceErrorCode = updateConstituentOnlinePresenceByIdResponse.status
            }
          }
        }
      }

      if (updateOnlinePresenceErrorCode) {
        const errorMessage = updateOnlinePresenceErrorCode
          ? `${updateOnlinePresenceErrorCode} error occurred when updating constituent online presence`
          : 'Error occurred when updating constituent online presence'
        if (isRequestErrorRetryable(updateOnlinePresenceErrorCode)) {
          throw new RetryableError(errorMessage)
        } else {
          integrationErrors.push(errorMessage)
        }
      }
    }

    if (Object.keys(phoneData).length > 0) {
      // request has phone data
      // get existing phones
      const getConstituentPhoneListResponse = await this.getConstituentPhoneList(constituentId)
      let updatePhoneErrorCode = undefined
      if (getConstituentPhoneListResponse.status !== 200) {
        updatePhoneErrorCode = getConstituentPhoneListResponse.status
      } else {
        const constituentPhoneListResults = await getConstituentPhoneListResponse.json()

        // check phone list for one that matches request
        let existingPhone: ExistingPhone | undefined = undefined
        if (constituentPhoneListResults.count > 0) {
          existingPhone = filterObjectListByMatchFields(constituentPhoneListResults.value, phoneData, [
            'int:number'
          ]) as ExistingPhone | undefined
        }

        if (!existingPhone) {
          // new phone
          // if this is the only phone, make it primary
          if (phoneData.primary !== false && constituentPhoneListResults.count === 0) {
            phoneData.primary = true
          }
          // create phone
          const createConstituentPhoneResponse = await this.createConstituentPhone(constituentId, phoneData as Phone)
          if (createConstituentPhoneResponse.status !== 200) {
            updatePhoneErrorCode = createConstituentPhoneResponse.status
          }
        } else {
          // existing phone
          if (
            existingPhone.inactive ||
            (phoneData.do_not_call !== undefined && phoneData.do_not_call !== existingPhone.do_not_call) ||
            (phoneData.primary !== undefined && phoneData.primary !== existingPhone.primary) ||
            phoneData.type !== existingPhone.type
          ) {
            // request has at least one phone field to update
            // update phone
            const updateConstituentPhoneByIdResponse = await this.updateConstituentPhoneById(
              existingPhone.id,
              phoneData as Phone
            )
            if (updateConstituentPhoneByIdResponse.status !== 200) {
              updatePhoneErrorCode = updateConstituentPhoneByIdResponse.status
            }
          }
        }
      }

      if (updatePhoneErrorCode) {
        const errorMessage = updatePhoneErrorCode
          ? `${updatePhoneErrorCode} error occurred when updating constituent online presence`
          : 'Error occurred when updating constituent online presence'
        if (isRequestErrorRetryable(updatePhoneErrorCode)) {
          throw new RetryableError(errorMessage)
        } else {
          integrationErrors.push(errorMessage)
        }
      }
    }

    if (integrationErrors.length > 0) {
      throw new IntegrationError(
        'One or more errors occurred when updating existing constituent: ' + integrationErrors.join(', '),
        'UPDATE_CONSTITUENT_ERROR',
        500
      )
    }

    return Promise.resolve({
      id: constituentId
    })
  }

  async updateConstituentPhoneById(phoneId: string, phoneData: Partial<Phone>): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/phones/${phoneId}`, {
      method: 'patch',
      json: {
        ...phoneData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async createGift(giftData: Gift): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_GIFTS_URL}/gifts`, {
      method: 'post',
      json: giftData
    })
  }
}
