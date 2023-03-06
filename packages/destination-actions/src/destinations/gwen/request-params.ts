import { RequestOptions } from '@segment/actions-core'

export const baseURL =
  process.env.NODE_ENV === 'prod' ? 'https://gwen.insertcoin.se/graphql' : 'http://localhost:4000/graphql'

export const defaultRequestParams: RequestOptions = {
  method: 'POST'
}
