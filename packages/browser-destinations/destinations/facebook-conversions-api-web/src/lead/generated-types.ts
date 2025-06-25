// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
    currency?: string;
    value?: number;
    eventID?: string;
    userData?: {
        external_id?: string; // Unique user ID from your system (SHA-256)
        em?: string; // Email (SHA-256)
        ph?: string; // Phone number (SHA-256)
        fn?: string; // First name (SHA-256)
        ln?: string; // Last name (SHA-256)
        ge?: string; // Gender (SHA-256)
        db?: string; // Date of birth (SHA-256) - format: YYYYMMDD
        ct?: string; // City (SHA-256)
        st?: string; // State (SHA-256)
        zp?: string; // ZIP/Postal code (SHA-256)
        country?: string; // Country code (SHA-256)
    },
    eventSourceUrl?: string; // URL of the page where the event occurred
    actionSource?: string
}
