import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const OTP_EXPIRY_MINUTES = 15;

interface TokenPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
}

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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    role: string = 'holder',
  ): Promise<{ access_token: string; refresh_token: string; user: UserInfo }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        active: true,
        refreshTokens: [],
        apiKeys: [],
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    await this.storeRefreshToken(user.id, tokens.refresh_token);

    this.logger.log(`User registered: ${user.email} (role: ${user.role})`);

    this.mailService.sendWelcome(user.email, user.name, user.role).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send welcome email to ${user.email}: ${message}`);
    });

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async createUser(
    email: string,
    name: string,
    role: string,
    loginUrl: string,
  ): Promise<{ email: string; name: string; role: string; temporaryPassword: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const temporaryPassword = randomBytes(6).toString('base64url').slice(0, 12) + 'A1!';
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        active: true,
        refreshTokens: [],
        apiKeys: [],
      },
    });

    this.logger.log(`User created by admin: ${user.email} (role: ${user.role})`);

    this.mailService.sendOnboarding(user.email, user.name, user.role, temporaryPassword, loginUrl).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send onboarding email to ${user.email}: ${message}`);
    });

    return { email: user.email, name: user.name, role: user.role, temporaryPassword };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string; user: UserInfo }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    await this.storeRefreshToken(user.id, tokens.refresh_token);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string; user: UserInfo }> {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    const hashedIncoming = this.hashToken(refreshToken);
    if (!user.refreshTokens.includes(hashedIncoming)) {
      this.logger.warn(`Refresh token reuse detected for user: ${user.id}`);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokens: [] },
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Rotate: remove old token, generate new pair, store new refresh token
    const updatedTokens = user.refreshTokens.filter(
      (t) => t !== hashedIncoming,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokens: updatedTokens },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    await this.storeRefreshToken(user.id, tokens.refresh_token);

    this.logger.log(`Token refreshed for user: ${user.id}`);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokens: [] },
    });

    this.logger.log(`User logged out (all tokens invalidated): ${userId}`);

    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: string): Promise<UserInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    return this.sanitizeUser(user);
  }

  async generateTokens(userId: string, role: string): Promise<TokenPair> {
    const accessPayload: TokenPayload = {
      sub: userId,
      role,
      type: 'access',
    };
    const refreshPayload: TokenPayload = {
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

  async generateApiKey(
    userId: string,
    keyName: string,
  ): Promise<{ apiKey: string; name: string }> {
    const rawKey = `tvk_${randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashApiKey(rawKey);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newApiKey = {
      hash: hashedKey,
      name: keyName,
      createdAt: new Date().toISOString(),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        apiKeys: {
          push: newApiKey,
        },
      },
    });

    this.logger.log(`API key created: ${keyName} for user: ${userId}`);

    return { apiKey: rawKey, name: keyName };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If an account with that email exists, a reset code has been sent' };
    }

    const otp = this.generateOtp();
    const otpHash = createHash('sha256').update(otp).digest('hex');
    const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetOtpHash: otpHash, resetOtpExpiry: expiry },
    });

    this.mailService.sendPasswordReset(user.email, user.name, otp).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send password reset email to ${user.email}: ${message}`);
    });

    this.logger.log(`Password reset OTP generated for: ${user.email}`);

    return { message: 'If an account with that email exists, a reset code has been sent' };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (!user.resetOtpHash || !user.resetOtpExpiry) {
      throw new UnauthorizedException('No password reset was requested');
    }

    if (new Date() > user.resetOtpExpiry) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetOtpHash: null, resetOtpExpiry: null },
      });
      throw new UnauthorizedException('OTP has expired');
    }

    const otpHash = createHash('sha256').update(otp).digest('hex');
    if (otpHash !== user.resetOtpHash) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtpHash: null,
        resetOtpExpiry: null,
        refreshTokens: [],
      },
    });

    this.logger.log(`Password reset successful for: ${user.email}`);

    return { message: 'Password has been reset successfully' };
  }

  private generateOtp(): string {
    const buffer = randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1000000;
    return num.toString().padStart(6, '0');
  }

  hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async validateApiKey(
    key: string,
  ): Promise<UserInfo> {
    const hashedKey = this.hashApiKey(key);

    const users = await this.prisma.user.findMany({
      where: {
        active: true,
        apiKeys: {
          some: {
            hash: hashedKey,
          },
        },
      },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid API key');
    }

    return this.sanitizeUser(users[0]);
  }

  async listUsers(role?: string) {
    const where = role ? { role } : {};
    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.sanitizeUser(u));
  }

  async updateUser(id: string, data: { name?: string; role?: string; active?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.sanitizeUser(updated);
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    await this.prisma.user.delete({ where: { id } });
    this.logger.log(`User deleted: ${user.email}`);
    return { deleted: true };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokens: {
          push: hashedToken,
        },
      },
    });
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    trustedIssuerId?: string | null;
    createdAt: Date;
  }): UserInfo {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      trustedIssuerId: user.trustedIssuerId ?? null,
      active: user.active,
      createdAt: user.createdAt,
    };
  }
}
