/**
 * Generates a random ID
 * @param length The ID length. The default is 24.
 * @returns A generated random ID (string)
 */
export function gen_random_id(length: number): string {
  const pattern = 'abcdefghijklmnopqrstuvwxyz123456789'
  const result = []
  for (let i = 0; i < length; i++) {
    result.push(pattern[Math.floor(Math.random() * pattern.length)])
  }
  return result.join('')
}
