import { IntegrationError } from '@segment/actions-core'

export const getUserIdentifier = ({
  identity,
  anonymous_id
}: {
  identity?: string | null
  anonymous_id?: string | null
}): { [k: string]: string } => {
  if (identity) {
    return {
      identity
    }
  }

  if (anonymous_id) {
    return {
      anonymous_id
    }
  }
  throw new IntegrationError('Either identity or anonymous id are required.')
}
