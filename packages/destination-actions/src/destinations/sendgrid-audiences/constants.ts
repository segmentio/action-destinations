export const MAX_BATCH_SIZE = 100

export const CREATE_LIST_URL = 'https://api.sendgrid.com/v3/marketing/lists'

export const UPSERT_CONTACTS_URL = 'https://api.sendgrid.com/v3/marketing/contacts'

export const REMOVE_CONTACTS_FROM_LIST_URL = 'https://api.sendgrid.com/v3/marketing/lists/{list_id}/contacts?contact_ids={contact_ids}'

export const MAX_CHUNK_SIZE_REMOVE = 100

export const GET_CONTACT_BY_EMAIL_URL = 'https://api.sendgrid.com/v3/marketing/contacts/search/emails'

export const SEARCH_CONTACTS_URL = 'https://api.sendgrid.com/v3/marketing/contacts/search'

export const MAX_CHUNK_SIZE_SEARCH = 50

export const GET_CUSTOM_FIELDS_URL = 'https://api.sendgrid.com/v3/marketing/field_definitions'