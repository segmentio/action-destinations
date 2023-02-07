import { ActionDefinition, IntegrationError, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BlackbaudSkyApi } from '../api'
import {
  Address,
  Constituent,
  Email,
  ExistingAddress,
  ExistingEmail,
  ExistingOnlinePresence,
  ExistingPhone,
  OnlinePresence,
  Phone
} from '../types'
import { dateStringToFuzzyDate, filterObjectListByMatchFields, isRequestErrorRetryable } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Individual Constituent',
  description: "Create or update an Individual Constituent record in Raiser's Edge NXT.",
  defaultSubscription: 'type = "identify"',
  fields: {
    address: {
      label: 'Address',
      description: "The constituent's address.",
      type: 'object',
      properties: {
        address_lines: {
          label: 'Address Lines',
          type: 'string'
        },
        city: {
          label: 'City',
          type: 'string'
        },
        country: {
          label: 'Country',
          type: 'string'
        },
        do_not_mail: {
          label: 'Do Not Mail',
          type: 'boolean'
        },
        postal_code: {
          label: 'ZIP/Postal Code',
          type: 'string'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        state: {
          label: 'State/Province',
          type: 'string'
        },
        type: {
          label: 'Address Type',
          type: 'string'
        }
      },
      default: {
        address_lines: {
          '@if': {
            exists: {
              '@path': '$.traits.address.street'
            },
            then: {
              '@path': '$.traits.address.street'
            },
            else: {
              '@path': '$.properties.address.street'
            }
          }
        },
        city: {
          '@if': {
            exists: {
              '@path': '$.traits.address.city'
            },
            then: {
              '@path': '$.traits.address.city'
            },
            else: {
              '@path': '$.properties.address.city'
            }
          }
        },
        country: {
          '@if': {
            exists: {
              '@path': '$.traits.address.country'
            },
            then: {
              '@path': '$.traits.address.country'
            },
            else: {
              '@path': '$.properties.address.country'
            }
          }
        },
        do_not_mail: '',
        postal_code: {
          '@if': {
            exists: {
              '@path': '$.traits.address.postalCode'
            },
            then: {
              '@path': '$.traits.address.postalCode'
            },
            else: {
              '@path': '$.properties.address.postalCode'
            }
          }
        },
        primary: '',
        state: {
          '@if': {
            exists: {
              '@path': '$.traits.address.state'
            },
            then: {
              '@path': '$.traits.address.state'
            },
            else: {
              '@path': '$.properties.address.state'
            }
          }
        },
        type: ''
      }
    },
    birthdate: {
      label: 'Birthdate',
      description: "The constituent's birthdate.",
      type: 'datetime',
      default: {
        '@if': {
          exists: {
            '@path': '$.traits.birthday'
          },
          then: {
            '@path': '$.traits.birthday'
          },
          else: {
            '@path': '$.properties.birthday'
          }
        }
      }
    },
    email: {
      label: 'Email',
      description: "The constituent's email address.",
      type: 'object',
      properties: {
        address: {
          label: 'Email Address',
          type: 'string'
        },
        do_not_email: {
          label: 'Do Not Email',
          type: 'boolean'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        type: {
          label: 'Email Type',
          type: 'string'
        }
      },
      default: {
        address: {
          '@if': {
            exists: {
              '@path': '$.traits.email'
            },
            then: {
              '@path': '$.traits.email'
            },
            else: {
              '@path': '$.properties.email'
            }
          }
        },
        do_not_email: '',
        primary: '',
        type: ''
      }
    },
    first: {
      label: 'First Name',
      description: "The constituent's first name up to 50 characters.",
      type: 'string',
      default: {
        '@if': {
          exists: {
            '@path': '$.traits.firstName'
          },
          then: {
            '@path': '$.traits.firstName'
          },
          else: {
            '@path': '$.properties.firstName'
          }
        }
      }
    },
    gender: {
      label: 'Gender',
      description: "The constituent's gender.",
      type: 'string',
      default: {
        '@if': {
          exists: {
            '@path': '$.traits.gender'
          },
          then: {
            '@path': '$.traits.gender'
          },
          else: {
            '@path': '$.properties.gender'
          }
        }
      }
    },
    income: {
      label: 'Income',
      description: "The constituent's income.",
      type: 'string'
    },
    last: {
      label: 'Last Name',
      description: "The constituent's last name up to 100 characters. This is required to create a constituent.",
      type: 'string',
      default: {
        '@if': {
          exists: {
            '@path': '$.traits.lastName'
          },
          then: {
            '@path': '$.traits.lastName'
          },
          else: {
            '@path': '$.properties.lastName'
          }
        }
      }
    },
    lookup_id: {
      label: 'Lookup ID',
      description: 'The organization-defined identifier for the constituent.',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    online_presence: {
      label: 'Online Presence',
      description: "The constituent's online presence.",
      type: 'object',
      properties: {
        address: {
          label: 'Web Address',
          type: 'string'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        type: {
          label: 'Online Presence Type',
          type: 'string'
        }
      },
      default: {
        address: {
          '@if': {
            exists: {
              '@path': '$.traits.website'
            },
            then: {
              '@path': '$.traits.website'
            },
            else: {
              '@path': '$.properties.website'
            }
          }
        },
        primary: '',
        type: ''
      }
    },
    phone: {
      label: 'Phone',
      description: "The constituent's phone number.",
      type: 'object',
      properties: {
        do_not_call: {
          label: 'Do Not Call',
          type: 'boolean'
        },
        number: {
          label: 'Phone Number',
          type: 'string'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        type: {
          label: 'Phone Type',
          type: 'string'
        }
      },
      default: {
        do_not_call: '',
        number: {
          '@if': {
            exists: {
              '@path': '$.traits.phone'
            },
            then: {
              '@path': '$.traits.phone'
            },
            else: {
              '@path': '$.properties.phone'
            }
          }
        },
        primary: '',
        type: ''
      }
    }
  },
  perform: async (request, { payload }) => {
    const blackbaudSkyApiClient: BlackbaudSkyApi = new BlackbaudSkyApi(request)

    // search for existing constituent
    let constituentId = undefined
    if (payload.email?.address || payload.lookup_id) {
      // default to searching by email
      let searchField = 'email_address'
      let searchText = payload.email?.address || ''

      if (payload.lookup_id) {
        // search by lookup_id if one is provided
        searchField = 'lookup_id'
        searchText = payload.lookup_id
      }

      const constituentSearchResponse = await blackbaudSkyApiClient.getExistingConstituents(searchField, searchText)
      const constituentSearchResults = await constituentSearchResponse.json()

      if (constituentSearchResults.count > 1) {
        // multiple existing constituents, throw an error
        throw new IntegrationError('Multiple records returned for given traits', 'MULTIPLE_EXISTING_RECORDS', 400)
      } else if (constituentSearchResults.count === 1) {
        // existing constituent
        constituentId = constituentSearchResults.value[0].id
      } else if (constituentSearchResults.count !== 0) {
        // if constituent count is not >= 0, something went wrong
        throw new IntegrationError('Unexpected record count for given traits', 'UNEXPECTED_RECORD_COUNT', 500)
      }
    }

    // data for constituent call
    const constituentData: Constituent = {
      first: payload.first,
      gender: payload.gender,
      income: payload.income,
      last: payload.last,
      lookup_id: payload.lookup_id
    }
    Object.keys(constituentData).forEach((key) => {
      if (!constituentData[key as keyof Constituent]) {
        delete constituentData[key as keyof Constituent]
      }
    })
    if (payload.birthdate) {
      const birthdateFuzzyDate = dateStringToFuzzyDate(payload.birthdate)
      if (birthdateFuzzyDate) {
        constituentData.birthdate = birthdateFuzzyDate
      }
    }

    // data for address call
    let constituentAddressData: Address = {}
    if (
      payload.address &&
      (payload.address.address_lines ||
        payload.address.city ||
        payload.address.country ||
        payload.address.postal_code ||
        payload.address.state) &&
      payload.address.type
    ) {
      constituentAddressData = payload.address
    }

    // data for email call
    let constituentEmailData: Email = {}
    if (payload.email && payload.email.address && payload.email.type) {
      constituentEmailData = payload.email
    }

    // data for online presence call
    let constituentOnlinePresenceData: OnlinePresence = {}
    if (payload.online_presence && payload.online_presence.address && payload.online_presence.type) {
      constituentOnlinePresenceData = payload.online_presence
    }

    // data for phone call
    let constituentPhoneData: Phone = {}
    if (payload.phone && payload.phone.number && payload.phone.type) {
      constituentPhoneData = payload.phone
    }

    if (!constituentId) {
      // new constituent
      // hardcode type
      constituentData.type = 'Individual'
      if (!constituentData.last) {
        // last name is required to create a new constituent
        // no last name, throw an error
        throw new IntegrationError('Missing last name value', 'MISSING_REQUIRED_FIELD', 400)
      } else {
        // request has last name
        // append other data objects to constituent
        if (Object.keys(constituentAddressData).length > 0) {
          constituentData.address = constituentAddressData
        }
        if (Object.keys(constituentEmailData).length > 0) {
          constituentData.email = constituentEmailData
        }
        if (Object.keys(constituentOnlinePresenceData).length > 0) {
          constituentData.online_presence = constituentOnlinePresenceData
        }
        if (Object.keys(constituentPhoneData).length > 0) {
          constituentData.phone = constituentPhoneData
        }

        // create constituent
        await blackbaudSkyApiClient.createConstituent(constituentData)
      }

      return
    } else {
      // existing constituent
      // aggregate all errors
      const integrationErrors = []
      if (Object.keys(constituentData).length > 0) {
        // request has at least one constituent field to update
        // update constituent
        const updateConstituentResponse = await blackbaudSkyApiClient.updateConstituent(constituentId, constituentData)
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

      if (Object.keys(constituentAddressData).length > 0) {
        // request has address data
        // get existing addresses
        const getConstituentAddressListResponse = await blackbaudSkyApiClient.getConstituentAddressList(constituentId)
        let updateAddressErrorCode = undefined
        if (getConstituentAddressListResponse.status !== 200) {
          updateAddressErrorCode = getConstituentAddressListResponse.status
        } else {
          const constituentAddressListResults = await getConstituentAddressListResponse.json()

          // check address list for one that matches request
          let existingAddress: ExistingAddress | undefined = undefined
          if (constituentAddressListResults.count > 0) {
            existingAddress = filterObjectListByMatchFields(
              constituentAddressListResults.value,
              constituentAddressData,
              ['address_lines', 'city', 'postal_code', 'state']
            ) as ExistingAddress | undefined
          }

          if (!existingAddress) {
            // new address
            // if this is the only address, make it primary
            if (constituentAddressData.primary !== false && constituentAddressListResults.count === 0) {
              constituentAddressData.primary = true
            }
            // create address
            const createConstituentAddressResponse = await blackbaudSkyApiClient.createConstituentAddress(
              constituentId,
              constituentAddressData
            )
            if (createConstituentAddressResponse.status !== 200) {
              updateAddressErrorCode = createConstituentAddressResponse.status
            }
          } else {
            // existing address
            if (
              existingAddress.inactive ||
              (constituentAddressData.do_not_mail !== undefined &&
                constituentAddressData.do_not_mail !== existingAddress.do_not_mail) ||
              (constituentAddressData.primary !== undefined &&
                constituentAddressData.primary &&
                constituentAddressData.primary !== existingAddress.primary) ||
              constituentAddressData.type !== existingAddress.type
            ) {
              // request has at least one address field to update
              // update address
              const updateConstituentAddressByIdResponse = await blackbaudSkyApiClient.updateConstituentAddressById(
                existingAddress.id,
                constituentAddressData
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

      if (Object.keys(constituentEmailData).length > 0) {
        // request has email data
        // get existing addresses
        const getConstituentEmailListResponse = await blackbaudSkyApiClient.getConstituentEmailList(constituentId)
        let updateEmailErrorCode = undefined
        if (getConstituentEmailListResponse.status !== 200) {
          updateEmailErrorCode = getConstituentEmailListResponse.status
        } else {
          const constituentEmailListResults = await getConstituentEmailListResponse.json()

          // check email list for one that matches request
          let existingEmail: ExistingEmail | undefined = undefined
          if (constituentEmailListResults.count > 0) {
            existingEmail = filterObjectListByMatchFields(constituentEmailListResults.value, constituentEmailData, [
              'address'
            ]) as ExistingEmail | undefined
          }

          if (!existingEmail) {
            // new email
            // if this is the only email, make it primary
            if (constituentEmailData.primary !== false && constituentEmailListResults.count === 0) {
              constituentEmailData.primary = true
            }
            // create email
            const createConstituentEmailResponse = await blackbaudSkyApiClient.createConstituentEmail(
              constituentId,
              constituentEmailData
            )
            if (createConstituentEmailResponse.status !== 200) {
              updateEmailErrorCode = createConstituentEmailResponse.status
            }
          } else {
            // existing email
            if (
              existingEmail.inactive ||
              (constituentEmailData.do_not_email !== undefined &&
                constituentEmailData.do_not_email !== existingEmail.do_not_email) ||
              (constituentEmailData.primary !== undefined &&
                constituentEmailData.primary &&
                constituentEmailData.primary !== existingEmail.primary) ||
              constituentEmailData.type !== existingEmail.type
            ) {
              // request has at least one email field to update
              // update email
              const updateConstituentEmailByIdResponse = await blackbaudSkyApiClient.updateConstituentEmailById(
                existingEmail.id,
                constituentEmailData
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

      if (Object.keys(constituentOnlinePresenceData).length > 0) {
        // request has online presence data
        // get existing online presences
        const getConstituentOnlinePresenceListResponse = await blackbaudSkyApiClient.getConstituentOnlinePresenceList(
          constituentId
        )
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
              constituentOnlinePresenceData,
              ['address']
            ) as ExistingOnlinePresence | undefined
          }

          if (!existingOnlinePresence) {
            // new online presence
            // if this is the only online presence, make it primary
            if (constituentOnlinePresenceData.primary !== false && constituentOnlinePresenceListResults.count === 0) {
              constituentOnlinePresenceData.primary = true
            }
            // create online presence
            const createConstituentOnlinePresenceResponse = await blackbaudSkyApiClient.createConstituentOnlinePresence(
              constituentId,
              constituentOnlinePresenceData
            )
            if (createConstituentOnlinePresenceResponse.status !== 200) {
              updateOnlinePresenceErrorCode = createConstituentOnlinePresenceResponse.status
            }
          } else {
            // existing online presence
            if (
              existingOnlinePresence.inactive ||
              (constituentOnlinePresenceData.primary !== undefined &&
                constituentOnlinePresenceData.primary !== existingOnlinePresence.primary) ||
              constituentOnlinePresenceData.type !== existingOnlinePresence.type
            ) {
              // request has at least one online presence field to update
              // update online presence
              const updateConstituentOnlinePresenceByIdResponse =
                await blackbaudSkyApiClient.updateConstituentOnlinePresenceById(
                  existingOnlinePresence.id,
                  constituentOnlinePresenceData
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

      if (Object.keys(constituentPhoneData).length > 0) {
        // request has phone data
        // get existing phones
        const getConstituentPhoneListResponse = await blackbaudSkyApiClient.getConstituentPhoneList(constituentId)
        let updatePhoneErrorCode = undefined
        if (getConstituentPhoneListResponse.status !== 200) {
          updatePhoneErrorCode = getConstituentPhoneListResponse.status
        } else {
          const constituentPhoneListResults = await getConstituentPhoneListResponse.json()

          // check phone list for one that matches request
          let existingPhone: ExistingPhone | undefined = undefined
          if (constituentPhoneListResults.count > 0) {
            existingPhone = filterObjectListByMatchFields(constituentPhoneListResults.value, constituentPhoneData, [
              'int:number'
            ]) as ExistingPhone | undefined
          }

          if (!existingPhone) {
            // new phone
            // if this is the only phone, make it primary
            if (constituentPhoneData.primary !== false && constituentPhoneListResults.count === 0) {
              constituentPhoneData.primary = true
            }
            // create phone
            const createConstituentPhoneResponse = await blackbaudSkyApiClient.createConstituentPhone(
              constituentId,
              constituentPhoneData
            )
            if (createConstituentPhoneResponse.status !== 200) {
              updatePhoneErrorCode = createConstituentPhoneResponse.status
            }
          } else {
            // existing phone
            if (
              existingPhone.inactive ||
              (constituentPhoneData.do_not_call !== undefined &&
                constituentPhoneData.do_not_call !== existingPhone.do_not_call) ||
              (constituentPhoneData.primary !== undefined && constituentPhoneData.primary !== existingPhone.primary) ||
              constituentPhoneData.type !== existingPhone.type
            ) {
              // request has at least one phone field to update
              // update phone
              const updateConstituentPhoneByIdResponse = await blackbaudSkyApiClient.updateConstituentPhoneById(
                existingPhone.id,
                constituentPhoneData
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

      return
    }
  }
}

export default action
