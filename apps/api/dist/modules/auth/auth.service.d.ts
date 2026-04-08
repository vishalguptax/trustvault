import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { MailService } from '../mail/mail.service';
interface TokenPair {
    access_token: string;
    refresh_token: string;
}
export interface UserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    trustedIssuerId: string | null;
    createdAt: Date;
}
export declare class AuthService {
    private readonly db;
    private readonly jwtService;
    private readonly configService;
    private readonly mailService;
    private readonly logger;
    constructor(db: DatabaseService, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    register(email: string, password: string, name: string, role?: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: UserInfo;
    }>;
    createUser(email: string, name: string, role: string, loginUrl: string): Promise<{
        email: string;
        name: string;
        role: string;
        temporaryPassword: string;
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: UserInfo;
    }>;
    refreshToken(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: UserInfo;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<UserInfo>;
    generateTokens(userId: string, role: string): Promise<TokenPair>;
    generateApiKey(userId: string, keyName: string): Promise<{
        apiKey: string;
        name: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(email: string, otp: string, newPassword: string): Promise<{
        message: string;
    }>;
    private generateOtp;
    hashApiKey(key: string): string;
    validateApiKey(key: string): Promise<UserInfo>;
    listUsers(role?: string): Promise<UserInfo[]>;
    updateUser(id: string, data: {
        name?: string;
        role?: string;
        active?: boolean;
    }): Promise<UserInfo>;
    deleteUser(id: string): Promise<{
        deleted: boolean;
    }>;
    private hashToken;
    private storeRefreshToken;
    private sanitizeUser;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map