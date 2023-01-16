// Anonymous user ID provided by segment is a uuid v4, but Heap expects an integer.
// Hashing the anonymous user ID to 2^53 bit space so these two formats are compatible.

import * as crypto from 'crypto'

const md5hasher = (anonymousUserId: string) => {
  const hash = crypto.createHash('md5').update(anonymousUserId, 'binary').digest()
  return [hash.readUInt32LE(0), hash.readUInt32LE(8)]
}

// Takes two 32 bit integers and creates a 53 bit integer by appending the first 21 bits
// of high32Bits to low32Bits.
const pack53Bits = (low32Bits: number, high32Bits: number) => {
  const mask = Math.pow(2, 53 - 32) - 1
  const twoToThe32 = 4294967296
  return low32Bits + (mask & high32Bits) * twoToThe32
}

export const getHeapUserId = (segmentAnonymousUserId: string) => {
  const hash = md5hasher(segmentAnonymousUserId)
  return pack53Bits(hash[0], hash[1])
}
