import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        data: {
            access_token: string;
            refresh_token: string;
            user: import("./auth.service").UserInfo;
        };
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        data: {
            access_token: string;
            refresh_token: string;
            user: import("./auth.service").UserInfo;
        };
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        data: {
            access_token: string;
            refresh_token: string;
            user: import("./auth.service").UserInfo;
        };
    }>;
    logout(userId: string): Promise<{
        data: {
            message: string;
        };
    }>;
    me(user: {
        id: string;
        email: string;
        name: string;
        role: string;
    }): Promise<{
        data: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        data: {
            message: string;
        };
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        data: {
            message: string;
        };
    }>;
    createApiKey(userId: string, name: string): Promise<{
        data: {
            apiKey: string;
            name: string;
        };
        message: string;
    }>;
    listUsers(role?: string): Promise<{
        data: import("./auth.service").UserInfo[];
    }>;
    updateUser(id: string, body: {
        name?: string;
        role?: string;
        active?: boolean;
    }): Promise<{
        data: import("./auth.service").UserInfo;
    }>;
    deleteUser(id: string): Promise<{
        data: {
            deleted: boolean;
        };
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map