import { browserDestination } from '../../runtime/shim';
import debouncePlugin from '../braze/debounce';
export const destination = {
    name: 'Braze Cloud Mode (Actions)',
    mode: 'device',
    settings: {},
    initialize: async () => {
        return {};
    },
    actions: {
        debouncePlugin
    }
};
export default browserDestination(destination);
//# sourceMappingURL=index.js.map