const generateHash = (seed: string) => {
  let i, chr, hash
  hash = 0

  if (seed.length === 0) return hash
  for (i = 0; i < seed.length; i++) {
    chr = seed.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return Math.abs(hash)
}

const generateValidHubSpotCustomObjectName = (seed: string) => {
  const hash = generateHash(seed)
  return {
    objectType: `p${hash}_Obj${hash}`,
    properties: { testProperty: `testValue-${hash}` }
  }
}
export { generateValidHubSpotCustomObjectName }
