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

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

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
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
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
  ): Promise<{ access_token: string; refresh_token: string }> {
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

    return tokens;
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
    createdAt: Date;
  }): UserInfo {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    };
  }
}
