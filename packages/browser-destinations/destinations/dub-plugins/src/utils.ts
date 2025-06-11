export const getCookieValue = (cookieName: string): string | null => {
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