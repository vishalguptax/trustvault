import { DatabaseService } from '../../database/database.service';
export declare class HealthController {
    private readonly db;
    constructor(db: DatabaseService);
    check(): Promise<{
        data: {
            status: string;
            version: string;
            uptime: number;
            database: string;
            timestamp: string;
        };
    }>;
}
//# sourceMappingURL=health.controller.d.ts.map