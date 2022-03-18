const action = {
    title: 'Sign Out User',
    description: 'Clear stored user ID so that future events and traits are not associated with this user.',
    platform: 'web',
    defaultSubscription: 'type = "track" and event = "Signed Out"',
    fields: {},
    perform: (Sprig, _event) => {
        Sprig('logoutUser');
    }
};
export default action;
//# sourceMappingURL=index.js.map