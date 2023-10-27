import { IntegrationError } from '@segment/actions-core'

type BasicListTypeMap = { basicUserList: any; [key: string]: any } | { crmBasedUserList: any; [key: string]: any }

export const buildListTypeMap = (listType: string): BasicListTypeMap => {
  switch (listType) {
    case 'basicUserList':
      return { basicUserList: {}, type: 'REMARKETING', membershipStatus: 'OPEN' }
    case 'customerMatchList':
      return { crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } }
    default:
      throw new IntegrationError('Invalid list type', 'INVALID_REQUEST_DATA', 400)
  }
}
