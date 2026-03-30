import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          return {
            statusCode,
            ...responseData,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          statusCode,
          data: responseData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
