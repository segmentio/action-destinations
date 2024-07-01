import type { Payload } from './generated-types'

export type Product = NonNullable<Payload['products']>[number]
