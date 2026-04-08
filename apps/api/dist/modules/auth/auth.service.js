"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const database_service_1 = require("../../database/database.service");
const mail_service_1 = require("../mail/mail.service");
const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const OTP_EXPIRY_MINUTES = 15;
let AuthService = AuthService_1 = class AuthService {
    db;
    jwtService;
    configService;
    mailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(db, jwtService, configService, mailService) {
        this.db = db;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
    }
    async register(email, password, name, role = 'holder') {
        const existing = await this.db.user.findOne({ email }).lean();
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await this.db.user.create({
            email,
            passwordHash,
            name,
            role,
            active: true,
            refreshTokens: [],
            apiKeys: [],
        });
        const userId = user._id.toString();
        const tokens = await this.generateTokens(userId, user.role);
        await this.storeRefreshToken(userId, tokens.refresh_token);
        this.logger.log(`User registered: ${user.email} (role: ${user.role})`);
        this.mailService.sendWelcome(user.email, user.name, user.role).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to send welcome email to ${user.email}: ${message}`);
        });
        return {
            ...tokens,
            user: this.sanitizeUser({
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                active: user.active,
                trustedIssuerId: user.trustedIssuerId ?? null,
                createdAt: user.createdAt,
            }),
        };
    }
    async createUser(email, name, role, loginUrl) {
        const existing = await this.db.user.findOne({ email }).lean();
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const temporaryPassword = (0, crypto_1.randomBytes)(6).toString('base64url').slice(0, 12) + 'A1!';
        const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_SALT_ROUNDS);
        const user = await this.db.user.create({
            email,
            passwordHash,
            name,
            role,
            active: true,
            refreshTokens: [],
            apiKeys: [],
        });
        this.logger.log(`User created by admin: ${user.email} (role: ${user.role})`);
        this.mailService.sendOnboarding(user.email, user.name, user.role, temporaryPassword, loginUrl).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to send onboarding email to ${user.email}: ${message}`);
        });
        return { email: user.email, name: user.name, role: user.role, temporaryPassword };
    }
    async login(email, password) {
        const user = await this.db.user.findOne({ email }).lean();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.active) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const userId = user._id.toString();
        const tokens = await this.generateTokens(userId, user.role);
        await this.storeRefreshToken(userId, tokens.refresh_token);
        this.logger.log(`User logged in: ${user.email}`);
        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    async refreshToken(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid token type');
        }
        const user = await this.db.user.findById(payload.sub).lean();
        if (!user || !user.active) {
            throw new common_1.UnauthorizedException('User not found or deactivated');
        }
        const hashedIncoming = this.hashToken(refreshToken);
        if (!user.refreshTokens.includes(hashedIncoming)) {
            const userId = user._id.toString();
            this.logger.warn(`Refresh token reuse detected for user: ${userId}`);
            await this.db.user.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
            throw new common_1.UnauthorizedException('Refresh token has been revoked');
        }
        // Rotate: remove old token, generate new pair, store new refresh token
        const updatedTokens = user.refreshTokens.filter((t) => t !== hashedIncoming);
        await this.db.user.updateOne({ _id: user._id }, { $set: { refreshTokens: updatedTokens } });
        const userId = user._id.toString();
        const tokens = await this.generateTokens(userId, user.role);
        await this.storeRefreshToken(userId, tokens.refresh_token);
        this.logger.log(`Token refreshed for user: ${userId}`);
        return {
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    async logout(userId) {
        await this.db.user.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
        this.logger.log(`User logged out (all tokens invalidated): ${userId}`);
        return { message: 'Logged out successfully' };
    }
    async validateUser(userId) {
        const user = await this.db.user.findById(userId).lean();
        if (!user || !user.active) {
            throw new common_1.UnauthorizedException('User not found or deactivated');
        }
        return this.sanitizeUser(user);
    }
    async generateTokens(userId, role) {
        const accessPayload = {
            sub: userId,
            role,
            type: 'access',
        };
        const refreshPayload = {
            sub: userId,
            role,
            type: 'refresh',
        };
        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(accessPayload, {
                expiresIn: ACCESS_TOKEN_EXPIRY,
            }),
            this.jwtService.signAsync(refreshPayload, {
                expiresIn: REFRESH_TOKEN_EXPIRY,
            }),
        ]);
        return { access_token, refresh_token };
    }
    async generateApiKey(userId, keyName) {
        const rawKey = `tvk_${(0, crypto_1.randomBytes)(32).toString('hex')}`;
        const hashedKey = this.hashApiKey(rawKey);
        const user = await this.db.user.findById(userId).lean();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const newApiKey = {
            hash: hashedKey,
            name: keyName,
            createdAt: new Date().toISOString(),
        };
        await this.db.user.updateOne({ _id: userId }, { $push: { apiKeys: newApiKey } });
        this.logger.log(`API key created: ${keyName} for user: ${userId}`);
        return { apiKey: rawKey, name: keyName };
    }
    async forgotPassword(email) {
        const user = await this.db.user.findOne({ email }).lean();
        if (!user) {
            return { message: 'If an account with that email exists, a reset code has been sent' };
        }
        const otp = this.generateOtp();
        const otpHash = (0, crypto_1.createHash)('sha256').update(otp).digest('hex');
        const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await this.db.user.findByIdAndUpdate(user._id, { $set: { resetOtpHash: otpHash, resetOtpExpiry: expiry } }, { new: true }).lean();
        this.mailService.sendPasswordReset(user.email, user.name, otp).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to send password reset email to ${user.email}: ${message}`);
        });
        this.logger.log(`Password reset OTP generated for: ${user.email}`);
        return { message: 'If an account with that email exists, a reset code has been sent' };
    }
    async resetPassword(email, otp, newPassword) {
        const user = await this.db.user.findOne({ email }).lean();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or OTP');
        }
        if (!user.resetOtpHash || !user.resetOtpExpiry) {
            throw new common_1.UnauthorizedException('No password reset was requested');
        }
        if (new Date() > user.resetOtpExpiry) {
            await this.db.user.findByIdAndUpdate(user._id, { $set: { resetOtpHash: null, resetOtpExpiry: null } }, { new: true }).lean();
            throw new common_1.UnauthorizedException('OTP has expired');
        }
        const otpHash = (0, crypto_1.createHash)('sha256').update(otp).digest('hex');
        if (otpHash !== user.resetOtpHash) {
            throw new common_1.UnauthorizedException('Invalid email or OTP');
        }
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await this.db.user.findByIdAndUpdate(user._id, {
            $set: {
                passwordHash,
                resetOtpHash: null,
                resetOtpExpiry: null,
                refreshTokens: [],
            },
        }, { new: true }).lean();
        this.logger.log(`Password reset successful for: ${user.email}`);
        return { message: 'Password has been reset successfully' };
    }
    generateOtp() {
        const buffer = (0, crypto_1.randomBytes)(4);
        const num = buffer.readUInt32BE(0) % 1000000;
        return num.toString().padStart(6, '0');
    }
    hashApiKey(key) {
        return (0, crypto_1.createHash)('sha256').update(key).digest('hex');
    }
    async validateApiKey(key) {
        const hashedKey = this.hashApiKey(key);
        const users = await this.db.user.find({
            active: true,
            'apiKeys.hash': hashedKey,
        }).lean();
        if (users.length === 0) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        return this.sanitizeUser(users[0]);
    }
    async listUsers(role) {
        const where = role ? { role } : {};
        const users = await this.db.user.find(where).sort({ createdAt: -1 }).lean();
        return users.map((u) => this.sanitizeUser(u));
    }
    async updateUser(id, data) {
        const user = await this.db.user.findById(id).lean();
        if (!user) {
            throw new common_1.NotFoundException(`User not found: ${id}`);
        }
        const updated = await this.db.user.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
        if (!updated) {
            throw new common_1.NotFoundException(`User not found: ${id}`);
        }
        return this.sanitizeUser(updated);
    }
    async deleteUser(id) {
        const user = await this.db.user.findById(id).lean();
        if (!user) {
            throw new common_1.NotFoundException(`User not found: ${id}`);
        }
        await this.db.user.deleteOne({ _id: id });
        this.logger.log(`User deleted: ${user.email}`);
        return { deleted: true };
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async storeRefreshToken(userId, refreshToken) {
        const hashedToken = this.hashToken(refreshToken);
        await this.db.user.updateOne({ _id: userId }, { $push: { refreshTokens: hashedToken } });
    }
    sanitizeUser(user) {
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            trustedIssuerId: user.trustedIssuerId ?? null,
            active: user.active,
            createdAt: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map