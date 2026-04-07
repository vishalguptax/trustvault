import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface ErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) || exception.message;
        error = (resp.error as string) || HttpStatus[status] || 'Error';
      } else {
        message = exception.message;
        error = HttpStatus[status] || 'Error';
      }
    } else if (exception instanceof Error) {
      const errMsg = exception.message;
      const errName = exception.constructor?.name || 'Error';

      // Mongoose: malformed ObjectID (CastError)
      if (errName === 'CastError' || errMsg.includes('Cast to ObjectId failed')) {
        status = HttpStatus.BAD_REQUEST;
        error = 'BadRequest';
        message = 'Invalid ID format';

      // Mongoose: duplicate key (unique constraint violation)
      } else if (errName === 'MongoServerError' && (exception as Error & { code?: number }).code === 11000) {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        const mongoError = exception as Error & { keyPattern?: Record<string, unknown> };
        const fields = mongoError.keyPattern ? Object.keys(mongoError.keyPattern).join(', ') : 'unknown field';
        message = `Unique constraint violation on: ${fields}`;

      // Mongoose: validation errors
      } else if (errName === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'BadRequest';
        message = 'Invalid request data';

      // Record not found patterns
      } else if (errMsg.includes('not found') || errMsg.includes('does not exist')) {
        status = HttpStatus.NOT_FOUND;
        error = 'NotFound';
        message = errMsg;

      // Unknown error — hide details in production
      } else {
        message = process.env.NODE_ENV === 'development' ? errMsg : 'Internal server error';
      }

      if (status >= 500) {
        this.logger.error(`[${errName}] ${errMsg}`, exception.stack);
      } else {
        this.logger.warn(`[${status}] ${error}: ${Array.isArray(message) ? message.join(', ') : message}`);
      }
    } else {
      this.logger.error('Unknown exception type', String(exception));
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
