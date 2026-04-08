import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
export declare class ApiKeyGuard implements CanActivate {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=api-key.guard.d.ts.map