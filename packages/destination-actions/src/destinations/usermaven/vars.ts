export const generateId = () => {
  let randomString = Math.random().toString(36).substring(2, 12)
  while (randomString.length < 10) {
    randomString += '0'
  }
  return randomString.substring(0, 10)
}
