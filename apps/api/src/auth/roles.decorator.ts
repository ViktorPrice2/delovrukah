import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

type LegacyDecoratorArgs = [
  target: object,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
];

type NewDecoratorContext = { kind: string };

function isNewDecoratorArgs(
  args: unknown[],
): args is [unknown, NewDecoratorContext] {
  return (
    args.length === 2 &&
    typeof args[1] === 'object' &&
    args[1] !== null &&
    'kind' in (args[1] as Record<string, unknown>)
  );
}

export const Roles = (...roles: Role[]): ClassDecorator & MethodDecorator => {
  const legacyDecorator = SetMetadata(ROLES_KEY, roles) as unknown as (
    ...args: LegacyDecoratorArgs
  ) => unknown;

  return ((...args: unknown[]) => {
    if (isNewDecoratorArgs(args)) {
      const [value, context] = args;

      if (context.kind === 'class') {
        Reflect.defineMetadata(ROLES_KEY, roles, value as object);
        return value;
      }

      if (
        context.kind === 'method' ||
        context.kind === 'getter' ||
        context.kind === 'setter'
      ) {
        Reflect.defineMetadata(ROLES_KEY, roles, value as object);
        return value;
      }
    }

    return legacyDecorator(...(args as LegacyDecoratorArgs));
  }) as ClassDecorator & MethodDecorator;
};
