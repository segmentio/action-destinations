const producer = {
  connect: async () => Promise.resolve(jest.fn()),
  send: async () => Promise.resolve(jest.fn()),
  disconnect: async () => Promise.resolve(jest.fn())
}

export const Kafka = jest.fn().mockImplementation(() => {
  return {
    producer: () => producer
  }
})

const mock = jest.fn().mockImplementation(() => {
  return {
    Kafka: Kafka
  }
})

export default mock
