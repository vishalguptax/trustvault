import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    try {
      const serviceIdentity = await this.authService.validateApiKey(apiKey);
      request.user = serviceIdentity;
      return true;
    } catch (error) {
      this.logger.warn(`API key validation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
