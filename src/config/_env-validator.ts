import type * as Joi from 'joi';

export function validateEnv<T extends object>(schema: Joi.ObjectSchema<T>, namespace: string): T {
  const { error, value } = schema.validate(process.env, {
    abortEarly: false,
  });

  if (error) {
    throw new Error(
      `Env validation failed [${namespace}]:\n` +
        error.details.map((d) => ` • ${d.message}`).join('\n'),
    );
  }

  return value;
}
