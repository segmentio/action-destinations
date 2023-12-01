export function updateUser(userID: string | undefined, userProps: object | undefined, gtag: Function, measurementId: string): void {
  if (userID) {
    gtag('config', measurementId, { user_id: userID })
  }
  if (userProps) {
    gtag('config', measurementId, { user_properties: userProps })
  }
}
