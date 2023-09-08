export const generateId = () => {
  const length = 10
  let result = ''

  for (let i = 0; i < length; i++) {
    const randomNumber = Math.floor(Math.random() * 10) // Generates a random digit between 0 and 9
    result += randomNumber.toString() // Convert the digit to a string and append it to the result
  }

  return result
}
