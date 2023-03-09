import { ActionDefinition, InputField, RequestFn } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { BlackbaudSkyApi } from '../api'
import { Address, Constituent, Email, OnlinePresence, Phone } from '../types'
import { splitConstituentPayload } from '../utils'

export const fields: Record<string, InputField> = {
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
  constituent_id: {
    label: 'Constituent ID',
    description: 'The ID of the constituent.',
    type: 'string'
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
    type: 'string'
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
}

export const perform: RequestFn<Settings, Payload> = async (request, { payload }) => {
  const blackbaudSkyApiClient: BlackbaudSkyApi = new BlackbaudSkyApi(request)

  let constituentId = payload.constituent_id
  if (!constituentId && (payload.email?.address || payload.lookup_id)) {
    const getExistingConstituentResponse = await blackbaudSkyApiClient.getExistingConstituent(
      payload.email,
      payload.lookup_id
    )
    constituentId = getExistingConstituentResponse.id
  }

  const [constituentData, addressData, emailData, onlinePresenceData, phoneData] = splitConstituentPayload(payload)

  if (!constituentId) {
    return blackbaudSkyApiClient.createConstituentWithRelatedObjects(
      constituentData as Constituent,
      addressData as Partial<Address>,
      emailData as Partial<Email>,
      onlinePresenceData as Partial<OnlinePresence>,
      phoneData as Partial<Phone>
    )
  } else {
    return blackbaudSkyApiClient.updateConstituentWithRelatedObjects(
      constituentId,
      constituentData as Partial<Constituent>,
      addressData as Partial<Address>,
      emailData as Partial<Email>,
      onlinePresenceData as Partial<OnlinePresence>,
      phoneData as Partial<Phone>
    )
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Individual Constituent',
  description: "Create or update an Individual Constituent record in Raiser's Edge NXT.",
  defaultSubscription: 'type = "identify"',
  fields,
  perform
}

export default action
