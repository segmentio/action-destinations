export function updateUser(userID: string | undefined, userProps: object | undefined, gtag: Function): void {
  if (userID) {
    gtag('set', { user_id: userID })
  }
  if (userProps) {
    gtag('set', { user_properties: userProps })
  }
}
