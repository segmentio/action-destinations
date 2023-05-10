export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
}

export interface StringIndexedObject {
  [key: string]: any
}

export interface ExistingConstituentResult {
  id: string | undefined
}

export interface CreateConstituentResult {
  id: string
}

export interface UpdateConstituentResult {
  id: string
}

export interface FuzzyDate {
  d: string
  m: string
  y: string
}

export interface Constituent {
  address?: Address
  birthdate?: FuzzyDate
  birthplace?: string
  email?: Email
  ethnicity?: string
  first?: string
  former_name?: string
  gender?: string
  gives_anonymously?: boolean
  income?: string
  industry?: string
  last: string
  lookup_id?: string
  marital_status?: string
  online_presence?: OnlinePresence
  phone?: Phone
  preferred_name?: string
  religion?: string
  suffix?: string
  suffix_2?: string
  title?: string
  title_2?: string
  type?: string
}

export interface Address {
  address_lines?: string
  city?: string
  country?: string
  do_not_mail?: boolean
  postal_code?: string
  primary?: boolean
  state?: string
  type: string
  inactive?: boolean
}

export interface ExistingAddress extends Address {
  id: string
}

export interface Email {
  address: string
  do_not_email?: boolean
  primary?: boolean
  type: string
  inactive?: boolean
}

export interface ExistingEmail extends Email {
  id: string
}

export interface OnlinePresence {
  address: string
  primary?: boolean
  type: string
  inactive?: boolean
}

export interface ExistingOnlinePresence extends OnlinePresence {
  id: string
}

export interface Phone {
  do_not_call?: boolean
  number: string
  primary?: boolean
  type: string
  inactive?: boolean
}

export interface ExistingPhone extends Phone {
  id: string
}

export interface Gift {
  acknowledgements?: GiftAcknowledgement[]
  amount: GiftAmount
  batch_number?: string
  batch_prefix?: string
  constituency?: string
  constituent_id: string
  date: string | number
  default_fundraiser_credits?: boolean
  default_soft_credits?: boolean
  gift_code?: string
  gift_splits: GiftSplit[]
  gift_status?: string
  is_anonymous?: boolean
  is_manual: boolean
  linked_gifts?: string[]
  lookup_id?: string
  payments: GiftPayment[]
  post_date?: string | number
  post_status?: string
  receipts?: GiftReceipt[]
  recurring_gift_schedule?: RecurringGiftSchedule
  reference?: string
  subtype?: string
  type: string
}

export interface GiftAcknowledgement {
  date?: string | number
  status?: string
}

export interface GiftAmount {
  value: number
}

export interface GiftSplit {
  amount: GiftAmount
  fund_id: string
}

export interface GiftPayment {
  check_date?: FuzzyDate
  check_number?: string
  payment_method: string
}

export interface GiftReceipt {
  date?: string | number
  status?: string
}

export interface RecurringGiftSchedule {
  end_date?: string | number
  frequency: string
  start_date: string | number
}

export interface ConstituentAction {
  constituent_id: string
  date: string | number
  category: string
  completed?: boolean
  completed_date?: string | number
  description?: string
  direction?: string
  end_time?: string
  fundraisers?: string[]
  location?: string
  opportunity_id?: string
  outcome?: string
  priority?: string
  start_time?: string
  status?: string
  summary?: string
  type?: string
  author?: string
}
