export const serializeParams = (params: any) => {
  return Object.entries(params)
    .reduce((acc, [k, v]: any[]) => {
      if (Array.isArray(v)) {
        for (const val of v) {
          acc.append(k, val)
        }
        return acc
      }
      if (v) {
        acc.append(k, v)
      }
      return acc
    }, new URLSearchParams())
    .toString()
}

export function normalizeEmail(email: string): string {
  if (!email) {
    return ''
  }

  email = email.trim().toLowerCase()

  if (email.endsWith('@gmail.com')) {
    const [localPart, domain] = email.split('@')
    const cleanedLocalPart = localPart.replace(/\./g, '').split('+')[0]
    return `${cleanedLocalPart}@${domain}`
  }

  return email
}
