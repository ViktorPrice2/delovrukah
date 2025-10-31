import { ConsoleLogger, LogLevel } from '@nestjs/common';

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      const ctorName =
        (value as { constructor?: { name?: string } }).constructor?.name ??
        'value';
      return `[Non-serializable ${ctorName}]`;
    }
  }

  return value;
}

export class AppLogger extends ConsoleLogger {
  constructor(context?: string) {
    if (context) {
      super(context, { timestamp: false });
    } else {
      super({ timestamp: false });
    }
  }

  log(message: unknown, context?: string): void {
    super.log(this.formatPayload('log', message, context));
  }

  warn(message: unknown, context?: string): void {
    super.warn(this.formatPayload('warn', message, context));
  }

  error(message: unknown, stack?: string, context?: string): void {
    const formatted = this.formatPayload('error', message, context, stack);
    super.error(formatted);
  }

  debug(message: unknown, context?: string): void {
    super.debug(this.formatPayload('debug', message, context));
  }

  verbose(message: unknown, context?: string): void {
    super.verbose(this.formatPayload('verbose', message, context));
  }

  private formatPayload(
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
