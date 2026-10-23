import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createZodAntdRule } from './zodAntdRule';

describe('createZodAntdRule', () => {
  it('passes validation when the value satisfies the schema', async () => {
    const schema = z.string().min(3);
    const rule = createZodAntdRule(schema);
    const validator = rule.validator;
    expect(validator).toBeDefined();

    await expect(validator!(rule, 'valid-string', () => {})).resolves.toBeUndefined();
  });

  it('rejects with the FIRST Zod error message on validation failure', async () => {
    const schema = z
      .string()
      .min(5, 'First error: Minimum 5 characters required')
      .email('Second error: Must be a valid email');

    const rule = createZodAntdRule(schema);
    const validator = rule.validator;
    expect(validator).toBeDefined();

    await expect(validator!(rule, 'abc', () => {})).rejects.toThrow(
      'First error: Minimum 5 characters required',
    );
  });

  it('rejects an empty required value with the expected message', async () => {
    const requiredSchema = z.string().min(1, 'Name is required');
    const rule = createZodAntdRule(requiredSchema);
    const validator = rule.validator;
    expect(validator).toBeDefined();

    await expect(validator!(rule, '', () => {})).rejects.toThrow('Name is required');
    await expect(validator!(rule, undefined, () => {})).rejects.toThrow();
  });

  it('handles schemas with a refinement', async () => {
    const evenNumberSchema = z
      .number()
      .refine((num) => num % 2 === 0, { message: 'Must be an even number' });

    const rule = createZodAntdRule(evenNumberSchema);
    const validator = rule.validator;
    expect(validator).toBeDefined();

    await expect(validator!(rule, 42, () => {})).resolves.toBeUndefined();
    await expect(validator!(rule, 41, () => {})).rejects.toThrow('Must be an even number');
  });

  it('handles schemas with a transform and refinement', async () => {
    const trimmedNonEmptySchema = z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, { message: 'Must not be empty or whitespace' });

    const rule = createZodAntdRule(trimmedNonEmptySchema);
    const validator = rule.validator;
    expect(validator).toBeDefined();

    await expect(validator!(rule, '  valid text  ', () => {})).resolves.toBeUndefined();
    await expect(validator!(rule, '     ', () => {})).rejects.toThrow(
      'Must not be empty or whitespace',
    );
  });
});
