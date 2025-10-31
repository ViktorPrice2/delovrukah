import { ConsoleLogger, LogLevel } from '@nestjs/common';

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }

  return value;
}

export class AppLogger extends ConsoleLogger {
  constructor(context?: string) {
    super(context, { timestamp: false });
  }

  log(message: unknown, context?: string): void {
    super.log(this.formatMessage('log', message, context));
  }

  warn(message: unknown, context?: string): void {
    super.warn(this.formatMessage('warn', message, context));
  }

  error(message: unknown, stack?: string, context?: string): void {
    const formatted = this.formatMessage('error', message, context, stack);
    super.error(formatted);
  }

  debug(message: unknown, context?: string): void {
    super.debug(this.formatMessage('debug', message, context));
  }

  verbose(message: unknown, context?: string): void {
    super.verbose(this.formatMessage('verbose', message, context));
  }

  private formatMessage(
    level: LogLevel,
    message: unknown,
    context?: string,
    stack?: string,
  ): string {
    const payload: Record<string, unknown> = {
      level,
      timestamp: new Date().toISOString(),
      context: context ?? this.context ?? 'App',
      message:
        typeof message === 'string' || typeof message === 'number'
          ? message
          : sanitizeValue(message),
    };

    if (stack) {
      payload.stack = stack;
    }

    return JSON.stringify(payload);
  }
}
