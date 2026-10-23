import type { RuleObject } from 'antd/es/form';
import type { z } from 'zod';

/**
 * Converts a Zod schema into an Ant Design Form validator rule.
 * Validates the field value against the schema and rejects with the first error message on failure.
 */
export function createZodAntdRule(schema: z.ZodType): RuleObject {
  return {
    validator: async (_rule: RuleObject, value: unknown): Promise<void> => {
      const result = await schema.safeParseAsync(value);

      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const message = firstIssue?.message ?? 'Validation error';
        return Promise.reject(new Error(message));
      }

      return Promise.resolve();
    },
  };
}
