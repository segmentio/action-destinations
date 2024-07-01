export const isRestrictedDomain = (email: string): boolean => {
  const restricted = ['gmailx.com', 'yahoox.com', 'aolx.com', 'hotmailx.com']
  const matches = /^.+@(.+)$/.exec(email.toLowerCase())

  if (!matches) {
    return false
  }

  const domain = matches[1]
  return restricted.includes(domain)
}
