const kafkajs = jest.genMockFromModule('kafkajs')

class Producer {
  sendCb: (args: { topic: string; messages: any[] }) => void

  constructor({ sendCb }: { sendCb: (args: { topic: string; messages: any[] }) => void }) {
    this.sendCb = sendCb
  }

  async connect() {
    return Promise.resolve()
  }

  async send({ topic, messages }: { topic: string; messages: any[] }) {
    this.sendCb({ topic, messages })
  }

  async disconnect() {
    return Promise.resolve()
  }
}

class Consumer {
  groupId: string
  subscribeCb: (topic: string, consumer: Consumer) => void
  eachMessage: (args: { message: any }) => void

  constructor({ groupId, subscribeCb }: { groupId: string; subscribeCb: (topic: string, consumer: Consumer) => void }) {
    this.groupId = groupId
    this.subscribeCb = subscribeCb
  }

  getGroupId() {
    return this.groupId
  }

  async connect() {
    return Promise.resolve()
  }

  async subscribe({ topic }: { topic: string }) {
    this.subscribeCb(topic, this)
  }

  async run({ eachMessage }: { eachMessage: (args: { message: any }) => void }) {
    this.eachMessage = eachMessage
  }

  async disconnect() {
    return Promise.resolve()
  }
}

;(kafkajs as any).Kafka = class Kafka {
  brokers: string[]
  clientId: string
  topics: Record<string, Record<string, Consumer[]>>

  constructor(config: { brokers: string[]; clientId: string }) {
    this.brokers = config.brokers
    this.clientId = config.clientId
    this.topics = {}
  }

  _subscribeCb(topic: any, consumer: any) {
    this.topics[topic] = this.topics[topic] || {}
    const topicObj = this.topics[topic]
    topicObj[consumer.getGroupId()] = topicObj[consumer.getGroupId()] || []
    topicObj[consumer.getGroupId()].push(consumer)
  }

  _sendCb({ topic, messages }: { topic: string; messages: any[] }) {
    messages.forEach((message) => {
      Object.values(this.topics[topic]).forEach((consumers) => {
        const consumerToGetMessage = Math.floor(Math.random() * consumers.length)
        consumers[consumerToGetMessage].eachMessage({
          message
        })
      })
    })
  }

  producer() {
    return new Producer({
      sendCb: this._sendCb.bind(this)
    })
  }

  consumer({ groupId }: { groupId: string }) {
    return new Consumer({
      groupId,
      subscribeCb: this._subscribeCb.bind(this)
    })
  }
}

export default kafkajs
