export function base64Encode(s: string) {
  return Buffer.from(s).toString('base64')
}

export function base64Decode(s: string) {
  return Buffer.from(s, 'base64').toString()
}
