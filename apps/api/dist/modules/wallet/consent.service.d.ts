import { DatabaseService } from '../../database/database.service';
export declare class ConsentService {
    private readonly db;
    constructor(db: DatabaseService);
    recordConsent(holderId: string, verifierDid: string, verifierName: string | undefined, credentialIds: string[], disclosedClaims: Record<string, string[]>, purpose?: string): Promise<Omit<import("../../database/schemas").ConsentRecordDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "_id"> & {
        id: string;
    }>;
    getConsentHistory(holderId: string): Promise<(Omit<import("../../database/schemas").ConsentRecordDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "_id"> & {
        id: string;
    })[]>;
}
//# sourceMappingURL=consent.service.d.ts.map