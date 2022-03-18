import { browserDestination } from '../../runtime/shim';
import sessionId from './sessionId';
export const destination = {
    name: 'Amplitude (Actions)',
    mode: 'device',
    actions: {
        sessionId
    },
    initialize: async () => {
        return {};
    }
};
export default browserDestination(destination);
//# sourceMappingURL=index.js.map