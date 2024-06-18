import { CS_DELIM } from './constants'
import { RefreshTokenResponse } from './types'

export const getNewAuth = (accessToken: string) => {
  const newAuth = accessToken.split(CS_DELIM)
  return {
    accessToken: newAuth[0],
    location: newAuth[1],
    organization_uid: newAuth[2]
  }
}

export const setNewAuth = (auth: RefreshTokenResponse) =>
  `${auth.access_token}${CS_DELIM}${auth.location}${CS_DELIM}${auth.organization_uid}`
