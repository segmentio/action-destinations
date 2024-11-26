import { Payload } from './generated-types'

export type ValidatedPayload = Payload & {
  validatedUserData: { [key: string]: unknown }
}
