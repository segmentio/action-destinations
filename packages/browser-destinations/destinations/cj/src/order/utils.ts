import { CJ } from '../types'

export function getCookieValue(cookieName: string): string | null {
  const name = cookieName + '='
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split('; ')

  for (const cookie of cookieArray) {
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length)
    }
  }

  return null
}

export function setOrderJSON(cj: CJ, orderJSON: CJ['order']) {
  cj.order = orderJSON
}