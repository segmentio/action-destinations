/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Allocation, State, Event } from './types'

export const evolvWrapper = {
  client: {
    emit: (args: string): void => window.evolv.client.emit(args),
    on: (eventType: string, fn: () => void): void => window.evolv.client.on(eventType, fn),
    getDisplayName: async (eid: string) => window.evolv.client.getDisplayName('experiments', eid)
  },
  context: {
    update: (args: State): void => window.evolv.context.update(args),
    getEvents: (args: string): Event[] => window.evolv.context.get(args) as Event[],
    getAllocations: (): Allocation[] =>
      (window.evolv.context.get('experiments') as { allocations: Allocation[] }).allocations
  },
  setUid: (uid: string) => window.evolv.setUid(uid)
}
