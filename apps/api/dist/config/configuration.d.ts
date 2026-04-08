export declare const configuration: () => {
    port: number;
    nodeEnv: string;
    database: {
        url: string | undefined;
    };
    cors: {
        origin: string;
    };
    did: {
        defaultMethod: string;
    };
    credential: {
        defaultFormat: string;
        defaultExpiryDays: number;
        statusListSize: number;
    };
    jwt: {
        secret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
    apiBaseUrl: string;
    issuer: {
        did: string;
        baseUrl: string;
    };
    webAppUrl: string;
    resend: {
        apiKey: string;
    };
};
//# sourceMappingURL=configuration.d.ts.map