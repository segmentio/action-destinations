import random from 'lodash/random'

export const generateId = () => {
  return random(1000000000, 9999999999)
}
