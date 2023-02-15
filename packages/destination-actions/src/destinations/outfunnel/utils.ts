const OUTFUNNEL_URL = 'https://sink.outfunnel.com';

export const getEndpoint = (userId: string) => `${OUTFUNNEL_URL}/events/segment/${encodeURIComponent(userId)}`;
