type INSTANCE_URL = string | null

let instance_url: INSTANCE_URL = null

export const getInstanceUrl = (): INSTANCE_URL => {
  return instance_url
}

export const setInstanceUrl = (value: string) => {
  instance_url = value
}
