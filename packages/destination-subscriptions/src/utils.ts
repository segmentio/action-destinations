function checkBooleanTrue(tokenValue: string): boolean {
  if (tokenValue === 'true') {
    return true
  }
  return false
}

function checkBooleanFalse(tokenValue: string): boolean {
  if (tokenValue === 'false') {
    return true
  }
  return false
}

export { checkBooleanTrue }
export { checkBooleanFalse }
