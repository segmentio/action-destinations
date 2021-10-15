export interface GetNameParams {
  name?: string
  firstName?: string
  lastName?: string
}

export function getName(payload: GetNameParams): string | undefined {
  // prettier-ignore
  return (
    payload.name                          ? payload.name :
    payload.firstName && payload.lastName ? `${payload.firstName} ${payload.lastName}`
    :                                       undefined
  )
}
