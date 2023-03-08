import {
  Address,
  Constituent,
  Email,
  Gift,
  GiftAcknowledgement,
  GiftReceipt,
  OnlinePresence,
  Phone,
  StringIndexedObject
} from '../types'
import { Payload as CreateOrUpdateIndividualConstituentPayload } from '../createOrUpdateIndividualConstituent/generated-types'
import { Payload as CreateGiftPayload } from '../createGift/generated-types'

export const dateStringToFuzzyDate = (dateString: string | number) => {
  // Ignore timezone
  const date = new Date((dateString + '').split('T')[0])
  if (isNaN(date.getTime())) {
    // invalid date object
    return false
  } else {
    // valid date object
    // convert date to a "Fuzzy date"
    // https://developer.blackbaud.com/skyapi/renxt/constituent/entities#FuzzyDate
    return {
      d: date.getUTCDate().toString(),
      m: (date.getUTCMonth() + 1).toString(),
      y: date.getUTCFullYear().toString()
    }
  }
}

export const splitConstituentPayload = (payload: CreateOrUpdateIndividualConstituentPayload) => {
  const constituentData: Partial<Constituent> = {
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

  let addressData: Partial<Address> = {}
  if (
    payload.address &&
    (payload.address.address_lines ||
      payload.address.city ||
      payload.address.country ||
      payload.address.postal_code ||
      payload.address.state) &&
    payload.address.type
  ) {
    addressData = payload.address
  }

  let emailData: Partial<Email> = {}
  if (payload.email && payload.email.address && payload.email.type) {
    emailData = payload.email
  }

  let onlinePresenceData: Partial<OnlinePresence> = {}
  if (payload.online_presence && payload.online_presence.address && payload.online_presence.type) {
    onlinePresenceData = payload.online_presence
  }

  let phoneData: Partial<Phone> = {}
  if (payload.phone && payload.phone.number && payload.phone.type) {
    phoneData = payload.phone
  }

  return [constituentData, addressData, emailData, onlinePresenceData, phoneData]
}

export const buildConstituentPayloadFromPayload = (payload: StringIndexedObject) => {
  // check if request includes fields to create or update a constituent
  // if so, append them to a new payload
  const constituentPayload: StringIndexedObject = {}
  Object.keys(payload).forEach((key: string) => {
    if (key.startsWith('constituent_')) {
      // only append non-empty fields/objects
      if (
        payload[key] &&
        (typeof payload[key] !== 'object' ||
          (Object.keys(payload[key]).length > 0 && Object.values(payload[key]).every((x) => !!x)))
      ) {
        let constituentPayloadKey = key.substring('constituent_'.length)
        if (key === 'constituent_id') {
          constituentPayloadKey = key
        }
        constituentPayload[constituentPayloadKey] = payload[key]
      }
    }
  })
  return constituentPayload as Partial<CreateOrUpdateIndividualConstituentPayload>
}

export const buildGiftDataFromPayload = (constituentId: string, payload: CreateGiftPayload) => {
  // data for gift call
  const giftData: Partial<Gift> = {
    amount: {
      value: payload.amount
    },
    constituent_id: constituentId,
    date: payload.date,
    gift_status: payload.gift_status,
    is_anonymous: payload.is_anonymous,
    // hardcode is_manual
    is_manual: true,
    lookup_id: payload.lookup_id,
    post_date: payload.post_date,
    post_status: payload.post_status,
    subtype: payload.subtype,
    type: payload.type
  }
  Object.keys(giftData).forEach((key) => {
    if (!giftData[key as keyof Gift]) {
      delete giftData[key as keyof Gift]
    }
  })

  // default date
  giftData.date = giftData.date || new Date().toISOString()

  // create acknowledgements array
  if (payload.acknowledgement) {
    const acknowledgementData: GiftAcknowledgement = {
      status: payload.acknowledgement.status || 'NEEDSACKNOWLEDGEMENT'
    }
    if (
      acknowledgementData.status !== 'NEEDSACKNOWLEDGEMENT' &&
      acknowledgementData.status !== 'DONOTACKNOWLEDGE' &&
      payload.acknowledgement.date
    ) {
      acknowledgementData.date = payload.acknowledgement.date
    }
    giftData.acknowledgements = [acknowledgementData]
  }

  // create gift splits array
  giftData.gift_splits = [
    {
      amount: {
        value: payload.amount
      },
      fund_id: payload.fund_id
    }
  ]

  // create payments array
  giftData.payments = [
    {
      payment_method: payload.payment_method
    }
  ]

  // fields for check gifts
  if (giftData.payments[0].payment_method === 'PersonalCheck') {
    giftData.payments[0].check_number = payload.check_number
    if (payload.check_date) {
      const checkDateFuzzyDate = dateStringToFuzzyDate(payload.check_date)
      if (checkDateFuzzyDate) {
        giftData.payments[0].check_date = checkDateFuzzyDate
      }
    }
  }

  // default post date
  if ((giftData.post_status === 'NotPosted' || giftData.post_status === 'Posted') && !giftData.post_date) {
    giftData.post_date = payload.date
  }

  // create receipts array
  if (payload.receipt) {
    const receiptData: GiftReceipt = {
      status: payload.receipt.status || 'NEEDSRECEIPT'
    }
    if (receiptData.status === 'RECEIPTED' && payload.receipt.date) {
      receiptData.date = payload.receipt.date
    }
    giftData.receipts = [receiptData]
  }

  // fields for recurring gifts
  if (giftData.type === 'RecurringGift') {
    if (payload.recurring_gift_schedule) {
      giftData.recurring_gift_schedule = {
        end_date: payload.recurring_gift_schedule.end_date,
        frequency: payload.recurring_gift_schedule.frequency || '',
        start_date: payload.recurring_gift_schedule.start_date || ''
      }
    }
  } else if (giftData.type === 'RecurringGiftPayment' && payload.linked_gifts) {
    giftData.linked_gifts = payload.linked_gifts
  }

  return giftData
}

export const filterObjectListByMatchFields = (
  list: StringIndexedObject[],
  data: StringIndexedObject,
  matchFields: string[]
) => {
  return list.find((item: StringIndexedObject) => {
    let isMatch: boolean | undefined = undefined
    matchFields.forEach((field: string) => {
      if (isMatch !== false) {
        let fieldName = field
        if (field.startsWith('int:')) {
          fieldName = field.split('int:')[1]
        }
        let itemValue = item[fieldName] ? item[fieldName].toLowerCase() : ''
        let dataValue = data[fieldName] ? data[fieldName].toLowerCase() : ''
        if (field.startsWith('int:')) {
          itemValue = itemValue.replace(/\D/g, '')
          dataValue = dataValue.replace(/\D/g, '')
        }
        isMatch = itemValue === dataValue
      }
    })
    return isMatch
  })
}

export const isRequestErrorRetryable = (statusCode: number) => {
  return statusCode === 429 || statusCode >= 500
}
