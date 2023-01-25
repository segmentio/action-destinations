import { ActionDefinition, IntegrationError, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SKY_API_BASE_URL } from '../constants'
import { isRequestErrorRetryable } from '../utils'

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
              '@path': '$.traits.address.postal_code'
            },
            then: {
              '@path': '$.traits.address.postal_code'
            },
            else: {
              '@path': '$.properties.address.postal_code'
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
      type: 'string',
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
            '@path': '$.traits.first_name'
          },
          then: {
            '@path': '$.traits.first_name'
          },
          else: {
            '@path': '$.properties.first_name'
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
            '@path': '$.traits.last_name'
          },
          then: {
            '@path': '$.traits.last_name'
          },
          else: {
            '@path': '$.properties.last_name'
          }
        }
      }
    },
    lookup_id: {
      label: 'Lookup ID',
      description: 'The organization-defined identifier for the constituent.',
      type: 'string'
    },
    online_presence: {
      label: 'Phone',
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
    // search for existing constituent
    let constituentId = undefined
    if (payload.email?.address || payload.lookup_id) {
      // default to searching by email
      let searchField = 'email_address'
      let searchText = payload.email?.address

      if (payload.lookup_id) {
        // search by lookup_id if one is provided
        searchField = 'lookup_id'
        searchText = payload.lookup_id
      }

      try {
        const constituentSearchResponse = await request(
          `${SKY_API_BASE_URL}/constituents/search?search_field=${searchField}&search_text=${searchText}`,
          {
            method: 'get'
          }
        )
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
      } catch (error) {
        const statusCode = error?.response?.status
        const errorMessage = statusCode
          ? `${statusCode} error occurred when searching for constituent`
          : 'Error occurred when searching for constituent'
        if (isRequestErrorRetryable(statusCode)) {
          throw new RetryableError(errorMessage)
        } else {
          throw new IntegrationError(errorMessage, 'CONSTITUENT_SEARCH_ERROR', statusCode || 500)
        }
      }
    }

    // data for constituent call
    const constituentData = {}
    const simpleConstituentFields = ['first', 'gender', 'income', 'last', 'lookup_id']
    simpleConstituentFields.forEach((key) => {
      if (payload[key] !== undefined) {
        constituentData[key] = payload[key]
      }
    })
    if (payload.birthdate) {
      const birthdateDate = new Date(payload.birthdate)
      if (!isNaN(birthdateDate)) {
        // valid date object
        // convert birthdate to a "Fuzzy date"
        // https://developer.blackbaud.com/skyapi/renxt/constituent/entities#FuzzyDate
        constituentData.birthdate = {
          d: birthdateDate.getDate().toString(),
          m: (birthdateDate.getMonth() + 1).toString(),
          y: birthdateDate.getFullYear().toString()
        }
      }
    }

    // data for address call
    let constituentAddressData = undefined
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
    let constituentEmailData = undefined
    if (payload.email && payload.email.address && payload.email.type) {
      constituentEmailData = payload.email
    }

    // data for online presence call
    let constituentOnlinePresenceData = undefined
    if (payload.online_presence && payload.online_presence.address && payload.online_presence.type) {
      constituentOnlinePresenceData = payload.online_presence
    }

    // data for phone call
    let constituentPhoneData = undefined
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
        if (constituentAddressData) {
          constituentData.address = constituentAddressData
        }
        if (constituentEmailData) {
          constituentData.email = constituentEmailData
        }
        if (constituentOnlinePresenceData) {
          constituentData.online_presence = constituentOnlinePresenceData
        }
        if (constituentPhoneData) {
          constituentData.phone = constituentPhoneData
        }

        // create constituent
        try {
          await request(`${SKY_API_BASE_URL}/constituents`, {
            method: 'post',
            json: constituentData
          })
        } catch (error) {
          const statusCode = error?.response?.status
          const errorMessage = statusCode
            ? `${statusCode} error occurred when creating constituent`
            : 'Error occurred when creating constituent'
          if (isRequestErrorRetryable(statusCode)) {
            throw new RetryableError(errorMessage)
          } else {
            throw new IntegrationError(errorMessage, 'CREATE_CONSTITUENT_ERROR', statusCode || 500)
          }
        }
      }

      return
    } else {
      // existing constituent
      // aggregate all errors
      const integrationErrors = []
      const retryableErrors = []
      if (Object.keys(constituentData).length > 0) {
        // request has at least one constituent field to update
        // update constituent
        try {
          await request(`${SKY_API_BASE_URL}/constituents/${constituentId}`, {
            method: 'patch',
            json: constituentData
          })
        } catch (error) {
          const statusCode = error?.response?.status
          const errorMessage = statusCode
            ? `${statusCode} error occurred when updating constituent`
            : 'Error occurred when updating constituent'
          if (isRequestErrorRetryable(statusCode)) {
            retryableErrors.push(errorMessage)
          } else {
            integrationErrors.push(errorMessage)
          }
        }
      }

      if (constituentAddressData) {
        // request has address data
        // get existing addresses
        try {
          const constituentAddressListResponse = await request(
            `${SKY_API_BASE_URL}/constituents/${constituentId}/addresses?include_inactive=true`,
            {
              method: 'get'
            }
          )
          const constituentAddressListResults = await constituentAddressListResponse.json()

          // check address list for one that matches request
          let existingAddress = undefined
          if (constituentAddressListResults.count > 0) {
            existingAddress = constituentAddressListResults.value.filter((result) => {
              return (
                result.address_lines.toLowerCase() === constituentAddressData.address_lines.toLowerCase() &&
                result.city.toLowerCase() === constituentAddressData.city.toLowerCase() &&
                result.country.toLowerCase() === constituentAddressData.country.toLowerCase() &&
                result.postal_code.toLowerCase() === constituentAddressData.postal_code.toLowerCase() &&
                result.state.toLowerCase() === constituentAddressData.state.toLowerCase()
              )
            })
          }

          if (!existingAddress) {
            // new address
            // create address
            await request(`${SKY_API_BASE_URL}/addresses`, {
              method: 'post',
              json: {
                ...constituentAddressData,
                constituent_id: constituentId,
                // if this is the only address, make it primary
                primary:
                  constituentAddressData.primary ||
                  (constituentAddressData.primary !== false && constituentAddressListResults.count === 0)
              }
            })
          } else {
            // existing address
            if (
              existingAddress.inactive ||
              constituentAddressData.do_not_mail !== existingAddress.do_not_mail ||
              constituentAddressData.primary !== existingAddress.primary ||
              constituentAddressData.type !== existingAddress.type
            ) {
              // request has at least one address field to update
              // update address
              await request(`${SKY_API_BASE_URL}/addresses/${existingAddress.id}`, {
                method: 'patch',
                json: {
                  ...constituentAddressData,
                  inactive: false
                }
              })
            }
          }
        } catch (error) {
          const statusCode = error?.response?.status
          const errorMessage = statusCode
            ? `${statusCode} error occurred when updating constituent address`
            : 'Error occurred when updating constituent address'
          if (isRequestErrorRetryable(statusCode)) {
            retryableErrors.push(errorMessage)
          } else {
            integrationErrors.push(errorMessage)
          }
        }
      }

      if (constituentEmailData) {
        // request has email data
        // get existing addresses
        try {
          const constituentEmailListResponse = await request(
            `${SKY_API_BASE_URL}/constituents/${constituentId}/emailaddresses?include_inactive=true`,
            {
              method: 'get'
            }
          )
          const constituentEmailListResults = await constituentEmailListResponse.json()

          // check email list for one that matches request
          let existingEmail = undefined
          if (constituentEmailListResults.count > 0) {
            existingEmail = constituentEmailListResults.value.filter((result) => {
              return result.address.toLowerCase() === constituentEmailData.address.toLowerCase()
            })
          }

          if (!existingEmail) {
            // new email
            // create email
            await request(`${SKY_API_BASE_URL}/emailaddresses`, {
              method: 'post',
              json: {
                ...constituentEmailData,
                constituent_id: constituentId,
                // if this is the only email, make it primary
                primary:
                  constituentEmailData.primary ||
                  (constituentEmailData.primary !== false && constituentEmailListResults.count === 0)
              }
            })
          } else {
            // existing email
            if (
              existingEmail.inactive ||
              constituentEmailData.do_not_email !== existingEmail.do_not_email ||
              constituentEmailData.primary !== existingEmail.primary ||
              constituentEmailData.type !== existingEmail.type
            ) {
              // request has at least one email field to update
              // update email
              await request(`${SKY_API_BASE_URL}/emailaddresses/${existingEmail.id}`, {
                method: 'patch',
                json: {
                  ...constituentEmailData,
                  inactive: false
                }
              })
            }
          }
        } catch (error) {
          const statusCode = error?.response?.status
          const errorMessage = statusCode
            ? `${statusCode} error occurred when updating constituent email`
            : 'Error occurred when updating constituent email'
          if (isRequestErrorRetryable(statusCode)) {
            retryableErrors.push(errorMessage)
          } else {
            integrationErrors.push(errorMessage)
          }
        }
      }

      if (constituentOnlinePresenceData) {
        // request has online presence data
        // get existing online presences
        try {
          const constituentOnlinePresenceListResponse = await request(
            `${SKY_API_BASE_URL}/constituents/${constituentId}/onlinepresences?include_inactive=true`,
            {
              method: 'get'
            }
          )
          const constituentOnlinePresenceListResults = await constituentOnlinePresenceListResponse.json()

          // check online presence list for one that matches request
          let existingOnlinePresence = undefined
          if (constituentOnlinePresenceListResults.count > 0) {
            existingOnlinePresence = constituentOnlinePresenceListResults.value.filter((result) => {
              return result.address.toLowerCase() === constituentOnlinePresenceData.address.toLowerCase()
            })
          }

          if (!existingOnlinePresence) {
            // new online presence
            // create online presence
            await request(`${SKY_API_BASE_URL}/onlinepresences`, {
              method: 'post',
              json: {
                ...constituentOnlinePresenceData,
                constituent_id: constituentId,
                // if this is the only online presence, make it primary
                primary:
                  constituentOnlinePresenceData.primary ||
                  (constituentOnlinePresenceData.primary !== false && constituentOnlinePresenceListResults.count === 0)
              }
            })
          } else {
            // existing online presence
            if (
              existingOnlinePresence.inactive ||
              constituentOnlinePresenceData.primary !== existingOnlinePresence.primary ||
              constituentOnlinePresenceData.type !== existingOnlinePresence.type
            ) {
              // request has at least one online presence field to update
              // update online presence
              await request(`${SKY_API_BASE_URL}/onlinepresences/${existingOnlinePresence.id}`, {
                method: 'patch',
                json: {
                  ...constituentOnlinePresenceData,
                  inactive: false
                }
              })
            }
          }
        } catch (error) {
          const statusCode = error?.response?.status
          const errorMessage = statusCode
            ? `${statusCode} error occurred when updating constituent online presence`
            : 'Error occurred when updating constituent online presence'
          if (isRequestErrorRetryable(statusCode)) {
            retryableErrors.push(errorMessage)
          } else {
            integrationErrors.push(errorMessage)
          }
        }
      }

      if (constituentPhoneData) {
        // request has phone data
        // get existing phones
        try {
          const constituentPhoneListResponse = await request(
            `${SKY_API_BASE_URL}/constituents/${constituentId}/phones?include_inactive=true`,
            {
              method: 'get'
            }
          )
          const constituentPhoneListResults = await constituentPhoneListResponse.json()

          // check phone list for one that matches request
          let existingPhone = undefined
          if (constituentPhoneListResults.count > 0) {
            existingPhone = constituentPhoneListResults.value.filter((result) => {
              return result.number === constituentPhoneData.number
            })
          }

          if (!existingPhone) {
            // new phone
            // create phone
            await request(`${SKY_API_BASE_URL}/phones`, {
              method: 'post',
              json: {
                ...constituentPhoneData,
                constituent_id: constituentId,
                // if this is the only phone, make it primary
                primary:
                  constituentPhoneData.primary ||
                  (constituentPhoneData.primary !== false && constituentPhoneListResults.count === 0)
              }
            })
          } else {
            // existing phone
            if (
              existingPhone.inactive ||
              constituentPhoneData.do_not_call !== existingPhone.do_not_call ||
              constituentPhoneData.primary !== existingPhone.primary ||
              constituentPhoneData.type !== existingPhone.type
            ) {
              // request has at least one phone field to update
              // update phone
              await request(`${SKY_API_BASE_URL}/phones/${existingPhone.id}`, {
                method: 'patch',
                json: {
                  ...constituentPhoneData,
                  inactive: false
                }
              })
            }
          }
        } catch (error) {
          const statusCode = error?.response?.status
          const errorMessage = statusCode
            ? `${statusCode} error occurred when updating constituent phone`
            : 'Error occurred when updating constituent phone'
          if (isRequestErrorRetryable(statusCode)) {
            retryableErrors.push(errorMessage)
          } else {
            integrationErrors.push(errorMessage)
          }
        }
      }

      if (integrationErrors.length > 0) {
        throw new IntegrationError(
          'One or more errors occurred when updating existing constituent: ' +
            integrationErrors.concat(retryableErrors).join(', '),
          'UPDATE_CONSTITUENT_ERROR',
          500
        )
      } else if (retryableErrors.length > 0) {
        throw new RetryableError(
          'One or more errors occurred when updating existing constituent: ' + retryableErrors.join(', ')
        )
      }

      return
    }
  }
}

export default action
