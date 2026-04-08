import { StatusService } from './status.service';
declare class RevokeDto {
    credentialId: string;
    reason?: string;
}
declare class SuspendDto {
    credentialId: string;
    reason?: string;
}
declare class ReinstateDto {
    credentialId: string;
}
export declare class StatusController {
    private readonly statusService;
    constructor(statusService: StatusService);
    getStatusList(id: string): Promise<{
        data: {
            '@context': string[];
            id: string;
            type: string[];
            issuer: string;
            validFrom: string;
            credentialSubject: {
                type: string;
                statusPurpose: string;
                encodedList: string;
            };
        };
    }>;
    revoke(dto: RevokeDto): Promise<{
        data: {
            revoked: boolean;
            updatedAt: Date;
        };
    }>;
    suspend(dto: SuspendDto): Promise<{
        data: {
            suspended: boolean;
            updatedAt: Date;
        };
    }>;
    reinstate(dto: ReinstateDto): Promise<{
        data: {
            reinstated: boolean;
            updatedAt: Date;
        };
    }>;
}
export {};
//# sourceMappingURL=status.controller.d.ts.map